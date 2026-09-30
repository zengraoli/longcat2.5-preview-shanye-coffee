/**
 * API 客户端：统一处理 {"code":0,"data":..,"message":"ok"} 响应格式。
 * 接口基地址可配置，默认 http://127.0.0.1:3300。
 * H5 调试时通过 Vite 代理 /api → 基地址；小程序编译后直连基地址。
 */

export interface ApiResult<T> {
  code: number;
  data: T;
  message: string;
}

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

const TOKEN_KEY = 'shanye_miniapp_token';

// 接口基地址：可通过 VITE_API_BASE 覆盖，默认 http://127.0.0.1:3300
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://127.0.0.1:3300';

let authToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getToken() {
  return authToken;
}
export function clearToken() {
  setToken(null);
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  // H5 调试走 /api 代理；小程序直连基地址
  const url = API_BASE === 'http://127.0.0.1:3300' && import.meta.env.DEV
    ? path
    : `${API_BASE}${path}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError(-1, '网络错误，请确认服务已启动');
  }

  if (res.status === 401) {
    clearToken();
    onUnauthorized?.();
    throw new ApiError(1003, '登录已失效，请重新登录');
  }

  let body: ApiResult<T>;
  try {
    body = (await res.json()) as ApiResult<T>;
  } catch {
    throw new ApiError(-1, '服务响应异常');
  }
  if (body.code !== 0) {
    throw new ApiError(body.code, body.message);
  }
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(payload ?? {}) }),
  patch: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(payload ?? {}) }),
};
