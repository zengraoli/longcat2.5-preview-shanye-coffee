<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../lib/api';
import { useAuth } from '../lib/authStore';
import type { Member } from '../lib/types';

const route = useRoute();
const router = useRouter();
const { login } = useAuth();
const phone = ref('');
const code = ref('');
const error = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  error.value = '';
  if (!/^1\d{10}$/.test(phone.value)) {
    error.value = '请输入正确的手机号';
    return;
  }
  loading.value = true;
  try {
    const data = await api.post<{ token: string; member: Member }>('/api/member/login', {
      phone: phone.value,
      code: code.value,
    });
    login(data.token, data.member);
    const redirect = (route.query.redirect as string) || '/member';
    router.push(redirect);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-brand">
        <svg viewBox="0 0 32 32" class="login-logo" fill="none" aria-hidden="true">
          <path d="M4 22 L12 10 L17 18 L21 12 L28 22 Z" fill="currentColor" opacity="0.9" />
          <circle cx="16" cy="7" r="2.4" fill="currentColor" />
        </svg>
        <span>山野咖啡</span>
      </div>
      <h1 class="login-title">会员登录</h1>
      <p class="login-sub">手机号 + 验证码登录</p>
      <form class="login-form" @submit.prevent="handleSubmit">
        <input
          v-model="phone"
          class="login-input"
          type="tel"
          placeholder="手机号"
          maxlength="11"
          autocomplete="tel"
        />
        <input
          v-model="code"
          class="login-input"
          type="text"
          placeholder="验证码（测试：123456）"
          maxlength="6"
          autocomplete="one-time-code"
        />
        <p v-if="error" class="login-error">{{ error }}</p>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>
      <p class="login-tip">首次登录将自动注册会员</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}
.login-card {
  width: 100%;
  max-width: 380px;
  padding: 2.5rem 2rem;
  text-align: center;
}
.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--brand-primary);
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}
.login-logo {
  width: 28px;
  height: 28px;
}
.login-title {
  font-size: 1.5rem;
  color: var(--brand-900);
  margin: 0 0 0.25rem;
}
.login-sub {
  color: var(--brand-500);
  font-size: 0.9rem;
  margin: 0 0 1.5rem;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.login-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--brand-200);
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.login-input:focus {
  border-color: var(--brand-400);
  box-shadow: 0 0 0 3px var(--brand-100);
}
.login-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0;
}
.login-btn {
  width: 100%;
}
.login-tip {
  margin-top: 1.25rem;
  font-size: 0.8rem;
  color: var(--brand-400);
}
</style>
