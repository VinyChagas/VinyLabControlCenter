const DEFAULT_BASE_URL = '/api';
const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL;
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function onUnauthorized(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    if (response.status === 401) {
      if (!path.startsWith('/auth/login')) {
        unauthorizedHandler?.();
      }
      let message = 'Não autenticado';
      try {
        const body = (await response.json()) as { error?: { message?: string } };
        if (body.error?.message) message = body.error.message;
      } catch {
        // ignore
      }
      throw new ApiError(message, 401, 'UNAUTHORIZED');
    }

    if (!response.ok) {
      let message = `Falha na requisição (${response.status})`;
      let code: string | undefined;
      try {
        const body = (await response.json()) as { error?: { message?: string; code?: string } };
        if (body.error?.message) message = body.error.message;
        code = body.error?.code;
      } catch {
        // ignore body parse errors
      }
      throw new ApiError(message, response.status, code);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(error instanceof Error ? error.message : 'Falha de rede');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
