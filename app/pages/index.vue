<script setup lang="ts">
import type { PublicUser, RawPrivilege, RawRole, ResultDto } from '@zvonimirsun/iszy-common'
import { UserStatus } from '@zvonimirsun/iszy-common'

const { data: usersResult, status: usersStatus } = await useFetch<ResultDto<PublicUser[]>>('/api/user/list', {
  query: {
    pageIndex: 1,
    pageSize: 20,
  },
  default: () => ({
    success: true,
    message: '',
    data: [],
  }),
})
const { data: rolesResult, status: rolesStatus } = await useFetch<ResultDto<RawRole[]>>('/api/roles', {
  default: () => ({
    success: true,
    message: '',
    data: [],
  }),
})
const { data: privilegesResult, status: privilegesStatus } = await useFetch<ResultDto<RawPrivilege[]>>('/api/privileges', {
  default: () => ({
    success: true,
    message: '',
    data: [],
  }),
})

const adminUsers = computed(() => usersResult.value.data ?? [])
const adminRoles = computed(() => rolesResult.value.data ?? [])
const adminPrivileges = computed(() => privilegesResult.value.data ?? [])
const activeUsers = computed(() => adminUsers.value.filter(user => user.status === UserStatus.ENABLED).length)
const inactiveUsers = computed(() => adminUsers.value.filter(user => user.status === UserStatus.DISABLED).length)
const pendingUsers = computed(() => adminUsers.value.filter(user => user.status === UserStatus.DEACTIVATED).length)
const userEnabledRate = computed(() => {
  if (!adminUsers.value.length) {
    return '0%'
  }

  return `${Math.round((activeUsers.value / adminUsers.value.length) * 100)}%`
})

const stats = computed(() => [
  {
    label: '用户总数',
    value: usersStatus.value === 'pending' ? '...' : adminUsers.value.length,
    icon: 'i-lucide-users',
    description: `${activeUsers.value} 个账号已启用`,
    to: '/users',
  },
  {
    label: '角色数量',
    value: rolesStatus.value === 'pending' ? '...' : adminRoles.value.length,
    icon: 'i-lucide-shield-check',
    description: '维护后台访问边界',
    to: '/roles',
  },
  {
    label: '权限点',
    value: privilegesStatus.value === 'pending' ? '...' : adminPrivileges.value.length,
    icon: 'i-lucide-key-round',
    description: '覆盖接口与资源动作',
    to: '/permissions',
  },
])

const recentUsers = computed(() => adminUsers.value.slice(0, 4))

const userStatusSummary = computed(() => [
  {
    label: '启用',
    value: activeUsers.value,
    icon: 'i-lucide-check-circle',
    color: 'success' as const,
  },
  {
    label: '待激活',
    value: pendingUsers.value,
    icon: 'i-lucide-clock-3',
    color: 'warning' as const,
  },
  {
    label: '停用',
    value: inactiveUsers.value,
    icon: 'i-lucide-ban',
    color: 'neutral' as const,
  },
])

const userStatusMeta: Record<UserStatus, { label: string, color: 'success' | 'warning' | 'neutral' }> = {
  [UserStatus.DEACTIVATED]: { label: '待激活', color: 'warning' },
  [UserStatus.ENABLED]: { label: '启用', color: 'success' },
  [UserStatus.DISABLED]: { label: '停用', color: 'neutral' },
}

function getUserStatusMeta(status: UserStatus) {
  return userStatusMeta[status] ?? { label: '未知', color: 'neutral' as const }
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="RBAC 工作台" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton to="/users" label="用户管理" icon="i-lucide-users" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <UCard
            v-for="stat in stats"
            :key="stat.label"
            variant="subtle"
            :ui="{ body: 'p-4 sm:p-5' }"
          >
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <div class="mb-4 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary ring ring-primary/15">
                    <UIcon :name="stat.icon" class="size-5" />
                  </div>
                  <p class="text-sm font-medium text-muted">
                    {{ stat.label }}
                  </p>
                  <p class="mt-1 text-3xl font-semibold text-highlighted">
                    {{ stat.value }}
                  </p>
                </div>
                <UButton
                  :to="stat.to"
                  icon="i-lucide-arrow-up-right"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :aria-label="`打开${stat.label}`"
                />
              </div>

              <p class="text-sm text-muted">
                {{ stat.description }}
              </p>
            </div>
          </UCard>
        </div>

        <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <UCard
            variant="subtle"
            :ui="{ header: 'px-4 py-4 sm:px-5', body: 'px-4 py-4 sm:px-5' }"
          >
            <template #header>
              <h2 class="text-base font-semibold text-highlighted">
                账号状态
              </h2>
              <p class="mt-1 text-sm text-muted">
                用于判断当前后台账号是否需要激活、停用或清理。
              </p>
            </template>

            <div class="space-y-4">
              <div class="grid divide-y divide-default rounded-md border border-default bg-default sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div
                  v-for="item in userStatusSummary"
                  :key="item.label"
                  class="px-4 py-3"
                >
                  <div class="flex items-center gap-2 text-sm text-muted">
                    <UIcon :name="item.icon" class="size-4" />
                    <span>{{ item.label }}</span>
                  </div>
                  <div class="mt-3 flex items-end justify-between gap-3">
                    <span class="text-2xl font-semibold text-highlighted">{{ item.value }}</span>
                    <UBadge :color="item.color" variant="subtle">
                      账号
                    </UBadge>
                  </div>
                </div>
              </div>

              <div class="rounded-md border border-default bg-elevated/40 px-4 py-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-highlighted">
                      启用率 {{ userEnabledRate }}
                    </p>
                    <p class="mt-1 text-sm text-muted">
                      工作台展示账号状态分布即可，角色授权细节放在角色管理里处理。
                    </p>
                  </div>
                  <UButton
                    to="/users"
                    label="查看用户"
                    icon="i-lucide-arrow-right"
                    color="neutral"
                    variant="outline"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <UCard
            variant="subtle"
            :ui="{ header: 'px-4 py-4 sm:px-5', body: 'p-0', footer: 'px-4 py-3 sm:px-5' }"
          >
            <template #header>
              <h2 class="text-base font-semibold text-highlighted">
                最近账号
              </h2>
              <p class="mt-1 text-sm text-muted">
                保留为快速入口，完整筛选和操作请进入用户管理。
              </p>
            </template>

            <div class="divide-y divide-default">
              <div v-if="usersStatus === 'pending'" class="px-5 py-8 text-center text-sm text-muted">
                加载用户中...
              </div>
              <div v-else-if="!recentUsers.length" class="px-5 py-8 text-center text-sm text-muted">
                暂无用户数据
              </div>
              <div
                v-for="user in recentUsers"
                :key="user.userId"
                class="flex items-center gap-3 px-4 py-4 sm:px-5"
              >
                <UAvatar :alt="user.nickName || user.userName" size="md" class="shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-highlighted">
                    {{ user.nickName || user.userName }}
                  </p>
                  <p class="mt-1 truncate text-sm text-muted">
                    #{{ user.userId }} · {{ user.email || user.mobile || user.userName }}
                  </p>
                </div>
                <UBadge :color="getUserStatusMeta(user.status as UserStatus).color" variant="subtle" class="shrink-0">
                  {{ getUserStatusMeta(user.status as UserStatus).label }}
                </UBadge>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-end">
                <UButton
                  to="/users"
                  label="打开用户管理"
                  icon="i-lucide-arrow-right"
                  color="neutral"
                  variant="ghost"
                />
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
