<script setup lang="ts">
definePageMeta({
  layout: false
})

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

onMounted(() => {
  userStore.logout()
    .then(() => {
      toast.add({ title: '登出成功', color: 'success' })
    })
    .catch(() => {
      toast.add({ title: '登出失败', description: '请稍后再试', color: 'error' })
    })
    .finally(() => {
      router.push(!route.redirectedFrom || route.redirectedFrom.path === '/logout' ? '/login' : route.redirectedFrom.path)
    })
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default flex items-center justify-center p-4">
      <UPageCard class="w-full max-w-md">
        <div class="w-full space-y-4 text-center">
          <UIcon name="i-lucide-lock" class="size-8 shrink-0 inline-block text-primary" />
          <h1 class="text-xl font-semibold text-highlighted">
            登出中...
          </h1>
        </div>
      </UPageCard>
    </div>
  </UApp>
</template>
