<script setup lang="ts">
import type { NuxtError } from '#app'
import { zh_cn } from '@nuxt/ui/locale'

const props = defineProps<{
  error: NuxtError
}>()

const requestReferrer = useRequestHeader('referer') || ''
const clientReferrer = ref('')

const statusCode = computed(() => props.error.statusCode || 500)
const isUnauthorized = computed(() => statusCode.value === 401)
const isForbidden = computed(() => statusCode.value === 403)
const isNotFound = computed(() => statusCode.value === 404)
const returnUrl = computed(() => clientReferrer.value || requestReferrer)
const errorMeta = computed(() => {
  if (isUnauthorized.value) {
    return {
      title: '请先登录',
      description: '当前页面需要登录后访问，请使用管理员账号登录后台。',
      icon: 'i-lucide-lock-keyhole',
      color: 'primary' as const,
    }
  }

  if (isForbidden.value) {
    return {
      title: '没有权限访问',
      description: '当前账号已登录，但不是后台管理员账号。',
      icon: 'i-lucide-shield-alert',
      color: 'warning' as const,
    }
  }

  if (isNotFound.value) {
    return {
      title: '页面不存在',
      description: '你访问的页面不存在，可能已被移动、删除或地址输入有误。',
      icon: 'i-lucide-file-question',
      color: 'neutral' as const,
    }
  }

  if (statusCode.value === 400) {
    return {
      title: '请求有误',
      description: '当前请求参数不完整或格式不正确，请返回后检查输入内容。',
      icon: 'i-lucide-circle-alert',
      color: 'warning' as const,
    }
  }

  if (statusCode.value === 500) {
    return {
      title: '服务内部错误',
      description: '后台服务处理请求时发生异常，请稍后重试或联系管理员查看服务日志。',
      icon: 'i-lucide-server-crash',
      color: 'error' as const,
    }
  }

  if (statusCode.value === 502) {
    return {
      title: '网关异常',
      description: '后台网关暂时无法获得有效响应，请稍后重试。',
      icon: 'i-lucide-server-off',
      color: 'error' as const,
    }
  }

  if (statusCode.value === 503) {
    return {
      title: '服务暂不可用',
      description: '后台服务可能正在维护或暂时过载，请稍后再试。',
      icon: 'i-lucide-server-cog',
      color: 'error' as const,
    }
  }

  if (statusCode.value === 504) {
    return {
      title: '请求超时',
      description: '后台服务响应超时，请稍后重试。',
      icon: 'i-lucide-clock-alert',
      color: 'error' as const,
    }
  }

  return {
    title: '页面不可用',
    description: '当前页面暂时不可用，请稍后再试。',
    icon: 'i-lucide-circle-alert',
    color: 'error' as const,
  }
})

useSeoMeta({
  title: computed(() => errorMeta.value.title),
  description: computed(() => errorMeta.value.description),
  robots: 'noindex,nofollow',
})

useHead({
  htmlAttrs: {
    lang: 'zh-CN',
  },
})

onMounted(() => {
  clientReferrer.value = document.referrer
})

function backToReferrer() {
  if (!returnUrl.value) {
    return
  }
  window.location.href = returnUrl.value
}

function clearToHome() {
  clearError({ redirect: '/' })
}

function clearToLogin() {
  clearError({ redirect: '/login' })
}
</script>

<template>
  <UApp :locale="zh_cn">
    <div class="min-h-screen bg-default flex items-center justify-center p-4">
      <UPageCard class="w-full max-w-md text-center">
        <div class="space-y-6">
          <div class="space-y-3">
            <UIcon
              :name="errorMeta.icon"
              class="mx-auto size-10"
              :class="{
                'text-primary': errorMeta.color === 'primary',
                'text-warning': errorMeta.color === 'warning',
                'text-muted': errorMeta.color === 'neutral',
                'text-error': errorMeta.color === 'error',
              }"
            />
            <div class="space-y-1">
              <p class="text-sm font-medium text-muted">
                {{ statusCode }}
              </p>
              <h1 class="text-xl font-semibold text-highlighted">
                {{ errorMeta.title }}
              </h1>
              <p class="text-sm text-muted">
                {{ errorMeta.description }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <UButton
              v-if="returnUrl"
              label="返回来源页面"
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="outline"
              @click="backToReferrer"
            />
            <UButton
              v-if="isUnauthorized"
              label="去登录"
              icon="i-lucide-log-in"
              @click="clearToLogin"
            />
            <UButton
              v-else-if="isForbidden"
              label="退出登录"
              icon="i-lucide-log-out"
              color="error"
              to="/logout"
            />
            <UButton
              v-else
              label="返回工作台"
              icon="i-lucide-house"
              @click="clearToHome"
            />
          </div>
        </div>
      </UPageCard>
    </div>
  </UApp>
</template>
