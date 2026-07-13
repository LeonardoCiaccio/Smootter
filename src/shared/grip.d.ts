/**
 * Minimal type shim for @leonardo.ciaccio/grip (ships no .d.ts).
 * Kept intentionally loose only what this project actually calls.
 */
declare module '@leonardo.ciaccio/grip' {
  export interface GripResponse {
    isSuccess: boolean
    message: string
    errorType: string | null
    result: unknown
    hookErrors: Array<{ label?: string; error: Error }>
  }

  export interface RegisterConfig<Args = unknown, Result = unknown> {
    name: string
    validate: (args: Args, context?: object) => void | Promise<void>
    business: (args: Args, context?: object) => Result | Promise<Result>
    assertResult?: (result: Result, context?: object) => void | Promise<void>
    timeout?: number
  }

  export interface HookPayload<Args = unknown> {
    name: string
    args: Args
    result: GripResponse
  }

  export interface HookDescriptor<Args = unknown, Context = object> {
    before?: (payload: Omit<HookPayload<Args>, 'result'>, context: Context) => void | Promise<void>
    after?: (payload: HookPayload<Args>, context: Context) => void | Promise<void>
    guard?: (payload: Omit<HookPayload<Args>, 'result'>, context: Context) => void | Promise<void>
    label?: string
  }

  export class Grip {
    constructor(options?: { logger?: { error: Function; warn: Function }; strict?: boolean })
    register<Args = unknown, Result = unknown>(config: RegisterConfig<Args, Result>): void
    hook<Args = unknown, Context = object>(name: string, hooks: HookDescriptor<Args, Context>): void
    fire(name: string, args?: unknown, context?: object): Promise<GripResponse>
  }
}
