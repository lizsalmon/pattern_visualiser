// Typed client for the micro:bit microwave gateway HTTP API.
// Every function takes the gateway base URL (e.g. "http://127.0.0.1:8080/") first.

export interface GatewayStatus {
  gateway: string
  microbits: string
  pattern_info: string
}

export type SweepDirection = 'left' | 'right' | 'top' | 'bottom'
export type ConfigName = 'volume' | 'pitch' | 'length' | 'count'
export type ControlKey = 'R' | 'H'

export class GatewayError extends Error {}

// The gateway's /prov call waits up to 10s for a micro:bit to answer.
const PROVISION_TIMEOUT_MS = 12_000
const STATUS_TIMEOUT_MS = 2_000

export function normalizeGatewayUrl(url: string): string {
  const trimmed = url.trim()
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
}

async function request<T = unknown>(
  baseUrl: string,
  path: string,
  init: { method: 'GET' | 'POST', body?: unknown, timeoutMs?: number },
): Promise<T> {
  const url = normalizeGatewayUrl(baseUrl) + path
  const headers: Record<string, string> = {}
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(url, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.timeoutMs ? AbortSignal.timeout(init.timeoutMs) : undefined,
    })
  }
  catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new GatewayError(`Timed out calling ${path}`)
    }
    throw new GatewayError(`Could not reach gateway at ${url}`)
  }

  if (!response.ok) {
    throw new GatewayError(`${path} failed: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  try {
    return JSON.parse(text) as T
  }
  catch {
    return text as T // some endpoints reply with plain text ("done")
  }
}

function post<T = unknown>(baseUrl: string, path: string, body: unknown = {}, timeoutMs?: number) {
  return request<T>(baseUrl, path, { method: 'POST', body, timeoutMs })
}

export function setPattern(baseUrl: string, pattern: string, rows: number, cols: number) {
  return post(baseUrl, 'set_pattern', { pattern, rows, cols })
}

export function wave(baseUrl: string, p: { row: string, start: number, stop: number, delay: number }) {
  return post(baseUrl, 'wave', p)
}

export function straightWave(baseUrl: string, p: {
  rstart: string
  rstop: string
  cstart: number
  cstop: number
  delay: number
  direction: SweepDirection
}) {
  return post(baseUrl, 'swave', p)
}

export function runPattern(baseUrl: string, p: { repeat: number, delay: number }) {
  return post(baseUrl, 'run_pattern', p)
}

export function stopPattern(baseUrl: string) {
  return post(baseUrl, 'stop_pattern')
}

export function setConfig(baseUrl: string, name: ConfigName, value: number) {
  return post(baseUrl, 'config', { [name]: value })
}

export function getStatus(baseUrl: string) {
  return request<GatewayStatus>(baseUrl, 'check', { method: 'GET', timeoutMs: STATUS_TIMEOUT_MS })
}

// Resolves with the "serial -> position" text, or null if no micro:bit answered.
export async function collectProvision(baseUrl: string, row: string, col: number): Promise<string | null> {
  const result = await post<{ result?: string }>(baseUrl, 'prov', { row, col }, PROVISION_TIMEOUT_MS)
  return result?.result ?? null
}

export function sendProvision(baseUrl: string, provOnly: string) {
  return post(baseUrl, 'prov_send', { prov_only: provOnly })
}

export function sendControl(baseUrl: string, ikey: ControlKey) {
  return post(baseUrl, 'send_control', { ikey })
}
