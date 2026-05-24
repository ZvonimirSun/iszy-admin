<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { title, logo } = usePublicConfig()
const teamLabel = computed(() => title || '后台管理')
const selectedTeam = computed(() => ({
  label: teamLabel.value,
  avatar: {
    src: logo || undefined,
    alt: teamLabel.value,
  },
}))

const items = computed<DropdownMenuItem[][]>(() => {
  return [[{
    ...selectedTeam.value,
  }], [{
    label: '后台配置',
    icon: 'i-lucide-cog',
    to: '/settings',
  }]]
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...selectedTeam,
        label: collapsed ? undefined : selectedTeam?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />
  </UDropdownMenu>
</template>
