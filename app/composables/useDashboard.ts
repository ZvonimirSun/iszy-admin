import { createSharedComposable } from '@vueuse/core'

function _useDashboard() {
  const router = useRouter()

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-u': () => router.push('/users'),
    'g-r': () => router.push('/roles'),
    'g-g': () => router.push('/groups'),
    'g-p': () => router.push('/permissions'),
    'g-s': () => router.push('/settings'),
  })

  return {}
}

export const useDashboard = createSharedComposable(_useDashboard)
