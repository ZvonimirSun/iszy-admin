export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/logout') {
    return
  }

  const userStore = useUserStore()
  let logged = false
  try {
    logged = await userStore.pullProfile(false, useRequestFetch())
  } catch (error) {
    const normalized = error as {
      status?: number
      statusCode?: number
      response?: {
        status?: number
      }
    }
    if (normalized.statusCode === 403 || normalized.status === 403 || normalized.response?.status === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: '没有权限访问',
        message: '仅管理员可以访问后台'
      })
    }
    throw error
  }

  if (!logged) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})
