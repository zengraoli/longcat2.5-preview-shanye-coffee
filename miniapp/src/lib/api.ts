/**
 * API 客户端：统一处理 {"code":0,"data":..,"message":"ok"} 响应格式。
 * 接口基地址可配置，默认 http://127.0.0.1:3300。
 * H5 调试时通过 Vite 代理 /api → 基地址；小程序编译后直连基地址。
 * 请求用 uni.request（H5 与小程序均可用），存储用 storage 抽象。
 */

import { storageGet, storageRemove, storageSet } from './storage';

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

let authToken: string | null = storageGet(TOKEN_KEY);

export function setToken(token: string | null) {
  authToken = token;
  if (token) storageSet(TOKEN_KEY, token);
  else storageRemove(TOKEN_KEY);
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

interface UniRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  data?: unknown;
  header?: Record<string, string>;
}

/** 用 uni.request 发请求，H5 与小程序均可用。 */
function uniRequest<T>(url: string, options: UniRequestOptions = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url,
      method: (options.method ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
      data: options.data as string | AnyObject | ArrayBuffer,
      header: options.header ?? {},
      success: (res) => {
        const body = res.data as ApiResult<T>;
        if (body && typeof body === 'object' && 'code' in body) {
          if (body.code === 0) {
            resolve(body.data);
          } else {
            if (body.code === 1003 || body.code === 2004) {
              clearToken();
              onUnauthorized?.();
            }
            reject(new ApiError(body.code, body.message));
          }
        } else {
          reject(new ApiError(-1, '服务响应异常'));
        }
      },
      fail: () => reject(new ApiError(-1, '网络错误，请确认服务已启动')),
    });
  });
}

async function request<T>(path: string, options: UniRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header ?? {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  // H5 调试走 /api 代理（相对路径，由 Vite 转发）；小程序直连基地址
  const url = API_BASE === 'http://127.0.0.1:3300' && import.meta.env.DEV
    ? path
    : `${API_BASE}${path}`;

  return uniRequest<T>(url, { ...options, header: headers });
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'POST', data: payload ?? {} }),
  patch: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'PATCH', data: payload ?? {} }),
};
