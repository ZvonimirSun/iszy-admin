<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import type { LocationQuery } from 'vue-router'
import * as z from 'zod'

definePageMeta({
  layout: false
})

const { features } = usePublicConfig()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const userStore = useUserStore()

const redirect = ref('/')
const otherQuery = ref({})
const error = ref<string>()
const loading = ref(false)

const query = route.query
if (typeof query.redirect === 'string') {
  redirect.value = query.redirect
}
otherQuery.value = getOtherQuery(query)

const fields: AuthFormField[] = [{
  name: 'userName',
  type: 'text',
  label: '用户名',
  placeholder: '请输入用户名'
}, {
  name: 'password',
  label: '密码',
  type: 'password',
  placeholder: '请输入密码'
}]

const schema = z.object({
  userName: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码')
})

type Schema = z.output<typeof schema>

onMounted(async () => {
  try {
    if (userStore.logged || await userStore.pullProfile()) {
      toast.add({ title: '已登录', description: '您已经登录，无需再次登录', color: 'info' })
      router.push({ path: redirect.value, query: otherQuery.value })
    }
  } catch (cause) {
    if (isForbiddenError(cause)) {
      showError(createError({
        statusCode: 403,
        statusMessage: '没有权限访问',
        message: '仅管理员可以访问后台'
      }))
    }
  }
})

async function login(payload: FormSubmitEvent<Schema>) {
  if (loading.value) {
    return
  }

  if (!navigator.onLine) {
    toast.add({ title: '网络异常', description: '请检查您的网络连接', color: 'error' })
    return
  }

  try {
    loading.value = true
    error.value = undefined
    await userStore.login(payload.data)
    toast.add({ title: '登录成功', description: '欢迎回来', color: 'success' })
    router.push({ path: redirect.value, query: otherQuery.value })
  } catch (cause) {
    if (isForbiddenError(cause)) {
      showError(createError({
        statusCode: 403,
        statusMessage: '没有权限访问',
        message: '仅管理员可以访问后台'
      }))
      return
    }
    error.value = cause instanceof Error ? cause.message : '登录失败'
  } finally {
    loading.value = false
  }
}

function getOtherQuery(query: LocationQuery) {
  const { redirect, ...result } = query
  return result
}

function isForbiddenError(error: unknown) {
  const normalized = error as {
    status?: number
    statusCode?: number
    response?: {
      status?: number
    }
  }
  return normalized.statusCode === 403 || normalized.status === 403 || normalized.response?.status === 403
}
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default flex items-center justify-center p-4">
      <UPageCard class="w-full max-w-md">
        <UAuthForm
          :schema="schema"
          title="登录 ISZY Admin"
          icon="i-lucide-lock"
          :fields="fields"
          :loading="loading"
          :submit="{ label: '登录' }"
          @submit="login"
        >
          <template v-if="features.publicRegister" #description>
            暂未开放自助注册，请联系管理员创建账号。
          </template>

          <template v-if="error" #validation>
            <UAlert color="error" icon="i-lucide-info" :title="error" />
          </template>
        </UAuthForm>
      </UPageCard>
    </div>
  </UApp>
</template>
