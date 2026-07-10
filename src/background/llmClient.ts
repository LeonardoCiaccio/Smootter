/**
 * llmClient — talks to the user's own, open-provider LLM endpoint.
 * Assumes an OpenAI-compatible Chat Completions contract (endpoint + bearer
 * key + model name), the de facto standard many providers and local
 * runtimes implement — no fixed provider list, no SDK, plain fetch.
 * The model MUST support tool calling: that's how it hands back structured
 * code instead of free-form text.
 */
import type { LlmConfig } from '@/shared/preferences'
import type { LlmErrorCode } from '@/shared/messages'

export interface LlmTestResult {
  ok: boolean
  errorCode?: LlmErrorCode
  detail?: string
}

export interface LlmGenerateResult {
  ok: boolean
  code?: string
  errorCode?: LlmErrorCode
  detail?: string
}

const WRITE_CODE_TOOL = {
  type: 'function',
  function: {
    name: 'write_code',
    description: 'Return the generated JavaScript code for the browser tool.',
    parameters: {
      type: 'object',
      properties: { code: { type: 'string', description: 'The complete JavaScript code.' } },
      required: ['code'],
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
  let response: Response
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
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
    [{ role: 'user', content: 'Call the write_code tool with a single console.log("ok"); statement.' }],
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
 * page could override), and — only when the editor actually has code — how
 * to treat it as discardable context rather than something to preserve.
 */
function buildSystemPrompt(hasExistingCode: boolean): string {
  const parts = [
    'You are the code generator for Pippo, a browser extension that lets users build small automation tools without writing code themselves.',
    'You write a single, self-contained JavaScript snippet. It gets injected directly into real, arbitrary web pages via chrome.userScripts (MAIN world) — no imports, no exports, no surrounding wrapper function, just plain statements.',
  ]
  if (hasExistingCode) {
    parts.push(
      "The user's message includes the code currently in the editor as existing context: they might be asking to improve, fix, or extend working code, not necessarily start over. If that existing code does not fit the new request, discard it and write fresh code instead of forcing it to fit.",
    )
  }
  parts.push(
    "If the request doesn't say anything about styling, apply any CSS inline on the elements themselves (e.g. element.style.cssText, always with 'important'), never via a <style> tag or an external stylesheet — the code runs on pages you don't control, and the page's own CSS could otherwise override or conflict with it.",
    'Always answer by calling the write_code tool with the final code.',
  )
  return parts.join(' ')
}

function buildUserMessage(prompt: string, existingCode: string): string {
  if (existingCode.trim() === '') return prompt
  return `Existing code in the editor (context — discard it if it doesn't fit the request below):\n\`\`\`js\n${existingCode}\n\`\`\`\n\nRequest: ${prompt}`
}

/** Asks the model to generate a tool's code from a natural-language prompt, given the editor's current code as context. */
export async function generateCode(
  config: LlmConfig,
  prompt: string,
  existingCode: string,
): Promise<LlmGenerateResult> {
  const result = await callChatCompletions(
    config,
    [
      { role: 'system', content: buildSystemPrompt(existingCode.trim() !== '') },
      { role: 'user', content: buildUserMessage(prompt, existingCode) },
    ],
    WRITE_CODE_TOOL,
  )

  if (!result.ok) return { ok: false, errorCode: result.errorCode, detail: result.detail }
  if (!result.toolCall || result.toolCall.function?.name !== 'write_code') {
    return { ok: false, errorCode: 'noToolSupport' }
  }

  try {
    const args = JSON.parse(result.toolCall.function?.arguments ?? '{}') as { code?: string }
    if (typeof args.code !== 'string' || args.code.trim() === '') {
      return { ok: false, errorCode: 'unknown', detail: 'Empty code in tool call.' }
    }
    return { ok: true, code: args.code }
  } catch (error) {
    return { ok: false, errorCode: 'unknown', detail: describeError(error) }
  }
}
