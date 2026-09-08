import { createAuthClient } from "@neondatabase/auth"

export interface PlatformRuntimeConfig {
  schemaVersion: 1
  environment: "production" | "preview" | "development"
  auth: {
    baseUrl: string
    provider: "managed-better-auth"
  }
  dataApi: {
    baseUrl: string
    schema: "platform"
  }
  database: {
    projectId: string
    branch: string
    region: string
  }
  security: {
    mode: "jwt-rls-rpc"
    anonymousAccess: false
  }
}

export type PlatformAuthClient = ReturnType<typeof createAuthClient>

export interface PlatformSession {
  session: {
    access_token: string
    expires_at?: number
  }
  user: {
    id: string
    name: string
    email: string
    role?: string | string[] | null
  }
}

export class PlatformRuntimeError extends Error {
  readonly status?: number
  readonly code?: string

  constructor(message: string, options: { status?: number; code?: string } = {}) {
    super(message)
    this.name = "PlatformRuntimeError"
    this.status = options.status
    this.code = options.code
  }
}

function assertHttps(value: string, label: string) {
  const url = new URL(value)
  if (url.protocol !== "https:") throw new PlatformRuntimeError(label + " must use HTTPS.")
  return value.replace(/\/+$/, "")
}

export async function loadRuntimeConfig(): Promise<PlatformRuntimeConfig> {
  const response = await fetch("/runtime-config.json", { cache: "no-store" })
  if (!response.ok) throw new PlatformRuntimeError("Platform runtime configuration is unavailable.", { status: response.status })

  const value = await response.json() as Partial<PlatformRuntimeConfig>
  if (
    value.schemaVersion !== 1 ||
    !value.auth?.baseUrl ||
    !value.dataApi?.baseUrl ||
    value.dataApi.schema !== "platform" ||
    value.security?.mode !== "jwt-rls-rpc" ||
    value.security.anonymousAccess !== false
  ) {
    throw new PlatformRuntimeError("Platform runtime configuration is invalid.")
  }

  return {
    ...value,
    auth: { ...value.auth, baseUrl: assertHttps(value.auth.baseUrl, "Auth URL") },
    dataApi: { ...value.dataApi, baseUrl: assertHttps(value.dataApi.baseUrl, "Data API URL") },
  } as PlatformRuntimeConfig
}

export function createPlatformAuthClient(config: PlatformRuntimeConfig) {
  return createAuthClient(config.auth.baseUrl)
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const object = payload as Record<string, unknown>
    if (typeof object.message === "string" && object.message.trim()) return object.message
    if (typeof object.error === "string" && object.error.trim()) return object.error
  }
  return fallback
}

export async function platformRpc<T>(
  config: PlatformRuntimeConfig,
  accessToken: string,
  functionName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!accessToken) throw new PlatformRuntimeError("An authenticated session is required.", { status: 401 })

  const response = await fetch(config.dataApi.baseUrl + "/rpc/" + encodeURIComponent(functionName), {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
      "Accept-Profile": config.dataApi.schema,
      "Content-Profile": config.dataApi.schema,
    },
    body: JSON.stringify(args),
  })

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const code = payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).code === "string"
      ? String((payload as Record<string, unknown>).code)
      : undefined
    throw new PlatformRuntimeError(errorMessage(payload, "Platform data request failed."), {
      status: response.status,
      code,
    })
  }

  return payload as T
}

export async function probe(url: string): Promise<"connected" | "degraded" | "offline"> {
  try {
    const response = await fetch(url, { cache: "no-store" })
    if (response.ok) return "connected"
    return response.status >= 500 ? "offline" : "degraded"
  } catch {
    return "offline"
  }
}
