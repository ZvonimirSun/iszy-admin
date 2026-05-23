<script setup lang="ts">
import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import { UserStatus } from '@zvonimirsun/iszy-common'
import { permissions, roles } from '~/data/rbac'

const { isNotificationsSlideoverOpen } = useDashboard()

const { data: usersResult, status: usersStatus } = await useFetch<ResultDto<PublicUser[]>>('/api/user/list', {
  query: {
    pageIndex: 1,
    pageSize: 20
  },
  default: () => ({
    success: true,
    message: '',
    data: []
  })
})

const adminUsers = computed(() => usersResult.value.data ?? [])
const activeUsers = computed(() => adminUsers.value.filter(user => user.status === UserStatus.ENABLED).length)
const highRiskPermissions = computed(() => permissions.filter(permission => permission.risk === 'high').length)

const stats = computed(() => [
  {
    label: '用户总数',
    value: usersStatus.value === 'pending' ? '...' : adminUsers.value.length,
    icon: 'i-lucide-users',
    description: `${activeUsers.value} 个账号已启用`
  },
  {
    label: '角色数量',
    value: roles.length,
    icon: 'i-lucide-shield-check',
    description: '已配置核心后台角色'
  },
  {
    label: '权限点',
    value: permissions.length,
    icon: 'i-lucide-key-round',
    description: `${highRiskPermissions.value} 个高风险权限需谨慎授权`
  }
])

const recentUsers = computed(() => adminUsers.value.slice(0, 4))

const userStatusMeta: Record<UserStatus, { label: string, color: 'success' | 'warning' | 'neutral' }> = {
  [UserStatus.DEACTIVATED]: { label: '待激活', color: 'warning' },
  [UserStatus.ENABLED]: { label: '启用', color: 'success' },
  [UserStatus.DISABLED]: { label: '停用', color: 'neutral' }
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
          <UTooltip text="通知" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UButton to="/users" label="新增用户" icon="i-lucide-user-plus" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <UPageCard
          v-for="stat in stats"
          :key="stat.label"
          :title="stat.label"
          :description="stat.description"
          variant="subtle"
        >
          <div class="flex items-center justify-between gap-4">
            <p class="text-3xl font-semibold text-highlighted">
              {{ stat.value }}
            </p>
            <UIcon :name="stat.icon" class="size-8 text-primary" />
          </div>
        </UPageCard>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <UPageCard
          title="角色授权概览"
          description="当前使用本地静态数据，后续可替换为角色与权限接口。"
          variant="subtle"
          :ui="{ container: 'p-0 sm:p-0 gap-y-0', header: 'p-4 border-b border-default mb-0' }"
        >
          <div class="divide-y divide-default">
            <div
              v-for="role in roles"
              :key="role.id"
              class="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-medium text-highlighted">
                    {{ role.name }}
                  </p>
                  <UBadge color="neutral" variant="subtle">
                    {{ role.code }}
                  </UBadge>
                </div>
                <p class="mt-1 text-sm text-muted">
                  {{ role.description }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <UBadge color="primary" variant="subtle">
                  {{ role.userCount }} 人
                </UBadge>
                <UBadge color="success" variant="subtle">
                  {{ role.permissionIds.length }} 项权限
                </UBadge>
              </div>
            </div>
          </div>
        </UPageCard>

        <UPageCard
          title="最近账号"
          description="来自 iszy-api 的用户列表。"
          variant="subtle"
          :ui="{ container: 'p-0 sm:p-0 gap-y-0', header: 'p-4 border-b border-default mb-0' }"
        >
          <div class="divide-y divide-default">
            <div v-if="usersStatus === 'pending'" class="p-4 text-sm text-muted">
              加载用户中...
            </div>
            <div v-else-if="!recentUsers.length" class="p-4 text-sm text-muted">
              暂无用户数据
            </div>
            <div
              v-for="user in recentUsers"
              :key="user.userId"
              class="flex items-center justify-between gap-3 p-4"
            >
              <div class="min-w-0">
                <p class="truncate font-medium text-highlighted">
                  {{ user.nickName || user.userName }}
                </p>
                <p class="truncate text-sm text-muted">
                  #{{ user.userId }} · {{ user.email || user.mobile || user.userName }}
                </p>
              </div>
              <UBadge :color="userStatusMeta[user.status as UserStatus].color" variant="subtle" class="shrink-0">
                {{ userStatusMeta[user.status as UserStatus].label }}
              </UBadge>
            </div>
          </div>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
