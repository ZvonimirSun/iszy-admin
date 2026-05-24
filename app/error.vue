<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const requestReferrer = useRequestHeader('referer') || ''
const clientReferrer = ref('')

const isForbidden = computed(() => props.error.statusCode === 403)
const returnUrl = computed(() => clientReferrer.value || requestReferrer)

useSeoMeta({
  title: computed(() => isForbidden.value ? '没有权限访问' : '页面不可用'),
  description: computed(() => isForbidden.value ? '当前账号没有访问后台的权限。' : '当前页面不可用。')
})

useHead({
  htmlAttrs: {
    lang: 'zh-CN'
  }
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
</script>

<template>
  <UApp>
    <div v-if="isForbidden" class="min-h-screen bg-default flex items-center justify-center p-4">
      <UPageCard class="w-full max-w-md text-center">
        <div class="space-y-6">
          <div class="space-y-3">
            <UIcon name="i-lucide-shield-alert" class="mx-auto size-10 text-warning" />
            <div class="space-y-1">
              <h1 class="text-xl font-semibold text-highlighted">
                没有权限访问
              </h1>
              <p class="text-sm text-muted">
                当前账号已登录，但不是后台管理员账号。
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
              label="退出登录"
              icon="i-lucide-log-out"
              color="error"
              to="/logout"
            />
          </div>
        </div>
      </UPageCard>
    </div>

    <UError v-else :error="error" />
  </UApp>
</template>
