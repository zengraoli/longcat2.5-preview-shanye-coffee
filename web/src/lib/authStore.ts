import { computed, reactive } from 'vue';
import type { Member } from './types';
import { getSession, saveSession, clearSession } from './auth';

/** 响应式认证状态，供组件订阅。 */
export const authState = reactive({
  user: getSession()?.member ?? null,
});

export function useAuth() {
  return {
    user: computed(() => authState.user),
    isLoggedIn: computed(() => !!authState.user),
    login(token: string, member: Member) {
      saveSession(token, member);
      authState.user = member;
    },
    logout() {
      clearSession();
      authState.user = null;
    },
  };
}
