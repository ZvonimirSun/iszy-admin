export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/logout') {
    return
  }

  const userStore = useUserStore()
  const logged = await userStore.pullProfile(false, useRequestFetch())

  if (!logged) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})
