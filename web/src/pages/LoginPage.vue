<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, setMemberToken } from '@/api'
import type { MemberInfo } from '@/types'
import { Coffee } from 'lucide-vue-next'

const router = useRouter()
const phone = ref('')
const code = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!phone.value || !/^1\d{10}$/.test(phone.value)) {
    error.value = '请输入正确的手机号'
    return
  }
  if (!code.value) {
    error.value = '请输入验证码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await api.post<{ token: string; member: MemberInfo }>('/member/login', {
      phone: phone.value,
      code: code.value,
    })
    setMemberToken(data.token)
    router.push('/member')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <Coffee :size="32" />
        </div>
        <h1>会员登录</h1>
        <p>手机号 + 验证码登录</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="login-error">{{ error }}</div>
        <div class="form-group">
          <label>手机号</label>
          <input
            v-model="phone"
            type="tel"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </div>
        <div class="form-group">
          <label>验证码</label>
          <div class="code-row">
            <input
              v-model="code"
              type="text"
              placeholder="请输入验证码"
              maxlength="6"
            />
            <span class="code-hint">固定验证码：123456</span>
          </div>
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--brand-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--brand-border);
  padding: 40px 32px;
  box-shadow: var(--shadow-md);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--brand-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.login-header h1 {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 0.9rem;
  color: var(--brand-text-light);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-error {
  background: #FFEBEE;
  color: #C62828;
  font-size: 0.85rem;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--brand-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--brand-primary);
}

.code-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.code-row input {
  flex: 1;
}

.code-hint {
  font-size: 0.75rem;
  color: var(--brand-text-light);
  white-space: nowrap;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: var(--brand-primary);
  color: white;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
}

.login-btn:hover:not(:disabled) {
  background: var(--brand-primary-dark);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
