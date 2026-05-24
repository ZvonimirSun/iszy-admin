<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const userStore = useUserStore()

const user = computed(() => {
  const profile = userStore.profile
  const label = profile?.nickName || profile?.userName || '未登录'

  return {
    label,
    avatar: {
      alt: label,
    },
  }
})

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.label,
  avatar: user.value.avatar,
}], [{
  label: '个人资料',
  icon: 'i-lucide-user',
}, {
  label: '系统设置',
  icon: 'i-lucide-settings',
  to: '/settings',
}], [{
  label: '外观',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: '系统',
    icon: 'i-lucide-monitor',
    type: 'checkbox',
    checked: colorMode.preference === 'system',
    onSelect(event: Event) {
      event.preventDefault()
      colorMode.preference = 'system'
    },
  }, {
    label: '浅色',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.preference === 'light',
    onSelect(event: Event) {
      event.preventDefault()
      colorMode.preference = 'light'
    },
  }, {
    label: '深色',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.preference === 'dark',
    onSelect(event: Event) {
      event.preventDefault()
      colorMode.preference = 'dark'
    },
  }],
}], [{
  label: '退出登录',
  icon: 'i-lucide-log-out',
  to: '/logout',
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />
  </UDropdownMenu>
</template>
