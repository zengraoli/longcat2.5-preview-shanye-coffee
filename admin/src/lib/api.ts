/**
 * API 客户端：统一处理 {"code":0,"data":..,"message":"ok"} 响应格式。
 * 开发环境通过 Vite 代理 /api → http://127.0.0.1:3300。
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

const TOKEN_KEY = 'shanye_admin_token';

// 模块加载时即从 localStorage 恢复 token，确保首个请求即携带
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

/** 未登录回调（由 App 注册，用于跳转登录页）。 */
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

  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
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
  put: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(payload ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
