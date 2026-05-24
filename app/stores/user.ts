import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { PublicSimpleUser } from '#shared/types/auth'
import { RoleEnum } from '@zvonimirsun/iszy-common'

type ProfileFetcher = <T>(request: string, opts?: {
  signal?: AbortSignal
}) => Promise<T>

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

function createForbiddenError() {
  return Object.assign(new Error('仅管理员可以访问后台'), {
    status: 403,
    statusCode: 403,
  })
}

function hasAdminRole(user?: PublicSimpleUser) {
  return user?.roles?.some(role => role.name === RoleEnum.ADMIN || role.name === RoleEnum.SUPERADMIN) ?? false
}

export const useUserStore = defineStore('user', () => {
  const profilePulled = ref(false)
  const profile = ref<PublicSimpleUser>()
  const logged = computed(() => !!profile.value)

  let pullProfilePromise: Promise<boolean> | null = null
  let pullProfileAbortController: AbortController | null = null

  async function login(payload: {
    userName: string
    password: string
  }) {
    let error = ''
    try {
      if (payload.userName && payload.password) {
        const res = await $fetch<ResultDto<PublicSimpleUser>>('/api/auth/login', {
          method: 'POST',
          body: {
            userName: payload.userName.trim(),
            password: payload.password,
          },
        })

        if (res.success) {
          profilePulled.value = true
          updateProfile(res.data)
          if (!hasAdminRole(res.data)) {
            throw createForbiddenError()
          }
          return
        }

        removeProfile()
        error = res.message
      }
      else {
        error = '用户名或密码错误'
      }
    }
    catch (cause) {
      if (isForbiddenError(cause)) {
        throw cause
      }
      removeProfile()
      throw cause
    }

    throw new Error(error)
  }

  async function logout() {
    const res = await $fetch<ResultDto<void>>('/api/auth/logout', {
      method: 'POST',
    })

    if (res?.success) {
      removeProfile()
      return
    }

    throw new Error(res?.message || '登出失败')
  }

  async function pullProfile(force = false, fetcher: ProfileFetcher = $fetch) {
    if (profilePulled.value && !force) {
      return logged.value
    }

    if (force) {
      pullProfileAbortController?.abort()
      pullProfileAbortController = null
      pullProfilePromise = null
    }

    if (pullProfilePromise && !force) {
      return pullProfilePromise
    }

    pullProfileAbortController = new AbortController()
    pullProfilePromise = (async () => {
      try {
        const res = await fetcher<ResultDto<{
          logged: boolean
          profile?: PublicSimpleUser
        }>>('/api/auth/check', {
          signal: pullProfileAbortController!.signal,
        })

        if (res?.success && res.data?.logged) {
          updateProfile(res.data.profile)
          profilePulled.value = true
          return true
        }

        removeProfile()
        profilePulled.value = true
        return false
      }
      catch (error) {
        if (isForbiddenError(error)) {
          profilePulled.value = true
          throw error
        }
        if ((error as Error).name !== 'AbortError') {
          removeProfile()
          profilePulled.value = true
        }
        return false
      }
      finally {
        pullProfileAbortController = null
        pullProfilePromise = null
      }
    })()

    return pullProfilePromise
  }

  function updateProfile(data?: PublicSimpleUser) {
    profile.value = data
  }

  function removeProfile() {
    updateProfile(undefined)
  }

  return {
    profilePulled,
    profile,
    logged,
    login,
    logout,
    pullProfile,
    updateProfile,
    removeProfile,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
