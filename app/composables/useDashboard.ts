import { createSharedComposable } from '@vueuse/core'

function _useDashboard() {
  const route = useRoute()
  const router = useRouter()
  const isNotificationsSlideoverOpen = ref(false)

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-u': () => router.push('/users'),
    'g-r': () => router.push('/roles'),
    'g-p': () => router.push('/permissions'),
    'g-s': () => router.push('/settings'),
    'n': () => isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value,
  })

  watch(() => route.fullPath, () => {
    isNotificationsSlideoverOpen.value = false
  })

  return {
    isNotificationsSlideoverOpen,
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
