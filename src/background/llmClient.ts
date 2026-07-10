/**
 * llmClient — talks to the user's own, open-provider LLM endpoint.
 * Assumes an OpenAI-compatible Chat Completions contract (endpoint + bearer
 * key + model name), the de facto standard many providers and local
 * runtimes implement — no fixed provider list, no SDK, plain fetch.
 * The model MUST support tool calling: that's how it hands back structured
 * code (and a chat reply) instead of free-form text.
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
    description: "Return the generated JavaScript code for the browser tool, plus a short chat reply for the user.",
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

interface ToolCall {
  function?: { name?: string; arguments?: string }
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { tool_calls?: ToolCall[] } }>
}

const REQUEST_TIMEOUT_MS = 20000

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

async function callChatCompletions(
  config: LlmConfig,
  messages: Array<{ role: string; content: string }>,
  tool: typeof WRITE_CODE_TOOL,
): Promise<{ ok: true; toolCall: ToolCall | undefined } | { ok: false; errorCode: LlmErrorCode; detail?: string }> {
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
        tools: [tool],
        tool_choice: { type: 'function', function: { name: tool.function.name } },
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

  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
  return { ok: true, toolCall }
}

/** Verifies the endpoint is reachable, the key is accepted, and the model actually calls tools. */
export async function testLlmConfig(config: LlmConfig): Promise<LlmTestResult> {
  const result = await callChatCompletions(
    config,
    [{ role: 'user', content: 'Call the write_code tool with a single console.log("ok"); statement and any short reply.' }],
    WRITE_CODE_TOOL,
  )

  if (!result.ok) return { ok: false, errorCode: result.errorCode, detail: result.detail }
  if (!result.toolCall || result.toolCall.function?.name !== 'write_code') {
    return { ok: false, errorCode: 'noToolSupport' }
  }
  return { ok: true }
}

/**
 * Builds the system prompt for code generation from what's actually there:
 * what the code is for and how it runs, the CSS rule this whole system
 * depends on (injected into arbitrary third-party pages, so styling must be
 * inline and forced, never a <style> tag or external stylesheet the host
 * page could override), how to reply in the chat (short, no code, no
 * reasoning), and — only when the editor actually has code — how to treat
 * it as discardable context rather than something to preserve.
 */
function buildSystemPrompt(existingCode: string): string {
  const parts = [
    'You are the code generator for Pippo, a browser extension that lets users build small automation tools without writing code themselves, through a chat conversation.',
    'You write a single, self-contained JavaScript snippet. It gets injected directly into real, arbitrary web pages via chrome.userScripts (MAIN world) — no imports, no exports, no surrounding wrapper function, just plain statements.',
    "If the request doesn't say anything about styling, apply any CSS inline on the elements themselves (e.g. element.style.cssText, always with 'important'), never via a <style> tag or an external stylesheet — the code runs on pages you don't control, and the page's own CSS could otherwise override or conflict with it.",
    "Always answer by calling the write_code tool. `reply` is always required: a short, plain chat message for the user — never code, never your reasoning, just what you'd say in a chat. `code` is only for when the user actually wants code written or changed — leave it out entirely for greetings, questions, or general conversation that doesn't call for it.",
  ]

  if (existingCode.trim() !== '') {
    parts.push(
      `Current code in the editor (context — the user may be asking to improve, fix, or extend it; if it doesn't fit the conversation, discard it and write fresh code instead):\n\`\`\`js\n${existingCode}\n\`\`\``,
    )
  }

  return parts.join('\n\n')
}

/** Asks the model to continue the chat and generate the tool's code, given the full conversation and the editor's current code as context. */
export async function generateCode(
  config: LlmConfig,
  messages: ChatMessage[],
  existingCode: string,
): Promise<LlmGenerateResult> {
  const result = await callChatCompletions(
    config,
    [
      { role: 'system', content: buildSystemPrompt(existingCode) },
      ...messages.map((message) => ({ role: message.role, content: message.content })),
    ],
    WRITE_CODE_TOOL,
  )

  if (!result.ok) return { ok: false, errorCode: result.errorCode, detail: result.detail }
  if (!result.toolCall || result.toolCall.function?.name !== 'write_code') {
    return { ok: false, errorCode: 'noToolSupport' }
  }

  try {
    const args = JSON.parse(result.toolCall.function?.arguments ?? '{}') as { code?: string; reply?: string }
    // code is optional — the model leaves it out for plain conversation, not every turn writes code.
    const code = typeof args.code === 'string' && args.code.trim() !== '' ? args.code : undefined
    return { ok: true, code, reply: args.reply ?? '' }
  } catch (error) {
    return { ok: false, errorCode: 'unknown', detail: describeError(error) }
  }
}
