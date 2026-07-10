/**
 * llmClient — talks to the user's own, open-provider LLM endpoint.
 * Assumes an OpenAI-compatible Chat Completions contract (endpoint + bearer
 * key + model name), the de facto standard many providers and local
 * runtimes implement — no fixed provider list, no SDK, plain fetch.
 * The model MUST support tool calling: that's how it hands back structured
 * code (and a chat reply) instead of free-form text. It also has a
 * `fetch_url` tool it can call mid-conversation to fetch real data (an API
 * response, a page) before writing code — the model only ever proposes the
 * call, this background context is what actually performs it.
 */
import type { LlmConfig } from '@/shared/preferences'
import type { LlmErrorCode, ChatMessage } from '@/shared/messages'

export interface LlmTestResult {
  ok: boolean
  errorCode?: LlmErrorCode
  detail?: string
}

export interface LlmGenerateResult {
  ok: boolean
  code?: string
  reply?: string
  errorCode?: LlmErrorCode
  detail?: string
}

const WRITE_CODE_TOOL = {
  type: 'function',
  function: {
    name: 'write_code',
    description: 'Deliver your answer: the generated JavaScript code for the browser tool, plus a short chat reply for the user. Call this when you are ready to reply, after using fetch_url if you needed to.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description:
            'The complete JavaScript code. Leave this out (or empty) if the message is just a question, greeting, or otherwise does not require writing or changing code — never invent placeholder code.',
        },
        reply: {
          type: 'string',
          description:
            'A short, plain chat message for the user describing what you did or asking a clarifying question. Never include code or reasoning here.',
        },
      },
      required: ['reply'],
    },
  },
} as const

const FETCH_TOOL = {
  type: 'function',
  function: {
    name: 'fetch_url',
    description:
      'Fetches a URL via HTTP GET and returns its status and response body (truncated if large). Use this when you need real data — an API response, a page, documentation — to write correct code, instead of guessing.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The absolute URL to fetch.' },
      },
      required: ['url'],
    },
  },
} as const

const TOOLS = [WRITE_CODE_TOOL, FETCH_TOOL] as const

interface ToolCall {
  id?: string
  type?: string
  function?: { name?: string; arguments?: string }
}

interface ConversationMessage {
  role: string
  content?: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: ConversationMessage }>
}

const REQUEST_TIMEOUT_MS = 20000
const FETCH_TOOL_TIMEOUT_MS = 10000
const FETCH_TOOL_MAX_BODY_LENGTH = 8000
const MAX_TOOL_ITERATIONS = 4

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/** Actually performs a fetch_url tool call. Runs in the background, not subject to page CORS. */
async function executeFetchTool(url: string): Promise<string> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TOOL_TIMEOUT_MS) })
    const text = await response.text()
    const body =
      text.length > FETCH_TOOL_MAX_BODY_LENGTH
        ? `${text.slice(0, FETCH_TOOL_MAX_BODY_LENGTH)}\n...[truncated]`
        : text
    return JSON.stringify({ status: response.status, body })
  } catch (error) {
    return JSON.stringify({ error: describeError(error) })
  }
}

async function callChatCompletions(
  config: LlmConfig,
  messages: ConversationMessage[],
): Promise<{ ok: true; message: ConversationMessage } | { ok: false; errorCode: LlmErrorCode; detail?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (config.apiKey.trim() !== '') headers.Authorization = `Bearer ${config.apiKey}`

  let response: Response
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        tools: TOOLS,
        tool_choice: 'required',
        max_tokens: config.maxOutputTokens,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    const errorCode = error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network'
    return { ok: false, errorCode, detail: describeError(error) }
  }

  if (!response.ok) {
    let detail = ''
    try {
      detail = await response.text()
    } catch {
      // best-effort only
    }
    return { ok: false, errorCode: 'http', detail: `${response.status} ${detail}`.trim() }
  }

  let data: ChatCompletionResponse
  try {
    data = await response.json()
  } catch (error) {
    return { ok: false, errorCode: 'unknown', detail: describeError(error) }
  }

  return { ok: true, message: data.choices?.[0]?.message ?? { role: 'assistant' } }
}

/** Verifies the endpoint is reachable, the key is accepted, and the model actually calls tools. */
export async function testLlmConfig(config: LlmConfig): Promise<LlmTestResult> {
  const result = await callChatCompletions(config, [
    {
      role: 'user',
      content: 'You have tool calling available. Call the write_code tool with a single console.log("ok"); statement and any short reply.',
    },
  ])

  if (!result.ok) return { ok: false, errorCode: result.errorCode, detail: result.detail }
  if (!result.message.tool_calls?.[0]?.function?.name) {
    return { ok: false, errorCode: 'noToolSupport' }
  }
  return { ok: true }
}

/**
 * Builds the system prompt for code generation from what's actually there:
 * an explicit, unambiguous statement that tool calling IS available (models
 * sometimes wrongly claim they don't support it), what the code is for and
 * how it runs, the CSS rule this whole system depends on (injected into
 * arbitrary third-party pages, so styling must be inline and forced, never
 * a <style> tag or external stylesheet the host page could override), how
 * to reply in the chat (short, no code, no reasoning), the page the tool is
 * being built for (so "this page"/"the page I'm on" resolves to something
 * real, fetchable via fetch_url), and — only when the editor actually has
 * code — how to treat it as discardable context rather than something to
 * preserve.
 */
function buildSystemPrompt(existingCode: string, pageUrl: string | undefined): string {
  const parts = [
    'You are the code generator for Pippo, a browser extension that lets users build small automation tools without writing code themselves, through a chat conversation.',
    'Tool calling is available and working in this conversation: you have `write_code` (deliver your final answer) and `fetch_url` (fetch real data before answering). You DO support tool calling here — never claim otherwise, never answer with plain text, always call one of these two tools.',
    'You write a single, self-contained JavaScript snippet. It gets injected directly into real, arbitrary web pages via chrome.userScripts (MAIN world) — no imports, no exports, no surrounding wrapper function, just plain statements.',
    "If the request doesn't say anything about styling, apply any CSS inline on the elements themselves (e.g. element.style.cssText, always with 'important'), never via a <style> tag or an external stylesheet — the code runs on pages you don't control, and the page's own CSS could otherwise override or conflict with it.",
    "Use fetch_url when you need real data to get the code right — an API's actual response shape, a page's real content — instead of guessing. Once you have what you need (or don't need it), call write_code to answer. `reply` is always required: a short, plain chat message for the user — never code, never your reasoning. `code` is only for when the user actually wants code written or changed — leave it out entirely for greetings, questions, or general conversation that doesn't call for it.",
    `Write \`reply\` in the language of locale "${chrome.i18n.getUILanguage()}" (Pippo's interface language), regardless of what language the user writes in. \`code\` stays in English throughout — identifiers, comments, and any user-facing strings the code itself prints or renders.`,
  ]

  if (pageUrl) {
    parts.push(
      `The user is building this tool while looking at: ${pageUrl}. If they refer to "this page", "the page I'm on", or similar, they mean this URL — use fetch_url on it if you need to see its actual content.`,
    )
  }

  if (existingCode.trim() !== '') {
    parts.push(
      `Current code in the editor (context — the user may be asking to improve, fix, or extend it; if it doesn't fit the conversation, discard it and write fresh code instead):\n\`\`\`js\n${existingCode}\n\`\`\``,
    )
  }

  return parts.join('\n\n')
}

/**
 * Asks the model to continue the chat and generate the tool's code, given
 * the full conversation, the editor's current code, and the page the user
 * is building the tool for, all as context. The model may call fetch_url
 * first (one or more times, actually executed here) to gather real data
 * before calling write_code with its final answer.
 */
export async function generateCode(
  config: LlmConfig,
  messages: ChatMessage[],
  existingCode: string,
  pageUrl: string | undefined,
): Promise<LlmGenerateResult> {
  const conversation: ConversationMessage[] = [
    { role: 'system', content: buildSystemPrompt(existingCode, pageUrl) },
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ]

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const result = await callChatCompletions(config, conversation)
    if (!result.ok) return { ok: false, errorCode: result.errorCode, detail: result.detail }

    const toolCall = result.message.tool_calls?.[0]
    const name = toolCall?.function?.name
    if (!toolCall || !name) {
      // Some providers don't reliably honor tool_choice: 'required' on a
      // continuation turn (e.g. right after a fetch_url result) and just
      // answer in plain text instead. That's still a real, usable answer —
      // treat it as the reply rather than failing the whole conversation.
      const content = result.message.content?.trim()
      if (content) return { ok: true, reply: content }
      return { ok: false, errorCode: 'noToolSupport' }
    }

    if (name === 'fetch_url') {
      let args: { url?: string } = {}
      try {
        args = JSON.parse(toolCall.function?.arguments ?? '{}')
      } catch {
        // fall through with an empty url — reported to the model below
      }
      const toolResult =
        typeof args.url === 'string' && args.url.trim() !== ''
          ? await executeFetchTool(args.url)
          : JSON.stringify({ error: 'Missing url.', note: 'write_code is still available — you can answer without this data.' })

      // Reconstruct the tool call explicitly (id + type: 'function' + function):
      // some providers require this exact shape to be echoed back, and won't
      // reliably continue the conversation without it.
      const toolCallId = toolCall.id ?? crypto.randomUUID()
      conversation.push({
        role: 'assistant',
        content: result.message.content ?? null,
        tool_calls: [{ id: toolCallId, type: 'function', function: toolCall.function }],
      })
      conversation.push({ role: 'tool', tool_call_id: toolCallId, content: toolResult })
      continue
    }

    if (name === 'write_code') {
      try {
        const args = JSON.parse(toolCall.function?.arguments ?? '{}') as { code?: string; reply?: string }
        // code is optional — the model leaves it out for plain conversation, not every turn writes code.
        const code = typeof args.code === 'string' && args.code.trim() !== '' ? args.code : undefined
        return { ok: true, code, reply: args.reply ?? '' }
      } catch (error) {
        return { ok: false, errorCode: 'unknown', detail: describeError(error) }
      }
    }

    return { ok: false, errorCode: 'unknown', detail: `Unexpected tool call: ${name}` }
  }

  return { ok: false, errorCode: 'unknown', detail: 'Too many tool calls without a final answer.' }
}
