<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

useDashboard()

const links = [{
  label: '工作台',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  },
}, {
  label: '用户管理',
  icon: 'i-lucide-users',
  to: '/users',
  onSelect: () => {
    open.value = false
  },
}, {
  label: '角色管理',
  icon: 'i-lucide-shield-check',
  to: '/roles',
  onSelect: () => {
    open.value = false
  },
}, {
  label: '用户组管理',
  icon: 'i-lucide-panels-top-left',
  to: '/groups',
  onSelect: () => {
    open.value = false
  },
}, {
  label: '权限管理',
  icon: 'i-lucide-key-round',
  to: '/permissions',
  onSelect: () => {
    open.value = false
  },
}, {
  label: '系统设置',
  to: '/settings',
  icon: 'i-lucide-settings',
  onSelect: () => {
    open.value = false
  },
}] satisfies NavigationMenuItem[]

const groups = computed(() => [{
  id: 'links',
  label: '导航',
  items: links,
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
