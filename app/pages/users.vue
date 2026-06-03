<script setup lang="ts">
import type { PublicUser, RawRole, RegisterUser, ResultDto } from '@zvonimirsun/iszy-common'
import { UserStatus } from '@zvonimirsun/iszy-common'

const toast = useToast()

const q = ref('')
const statusFilter = ref<'all' | UserStatus>('all')
const createOpen = ref(false)
const deleteOpen = ref(false)
const deleteLoading = ref(false)
const userToDelete = ref<PublicUser>()
const roleOpen = ref(false)
const roleLoading = ref(false)
const userToAssignRoles = ref<PublicUser>()
const selectedRoleIds = ref<number[]>([])
const roleQuery = ref('')
const pageIndex = ref(1)
const pageSize = ref(20)

const newUser = reactive<RegisterUser>({
  userName: '',
  nickName: '',
  passwd: '',
  mobile: '',
  email: '',
})

const statusItems = [
  { label: '全部状态', value: 'all' },
  { label: '待激活', value: UserStatus.DEACTIVATED },
  { label: '启用', value: UserStatus.ENABLED },
  { label: '停用', value: UserStatus.DISABLED },
]

const statusMeta: Record<UserStatus, { label: string, color: 'success' | 'warning' | 'neutral' }> = {
  [UserStatus.DEACTIVATED]: { label: '待激活', color: 'warning' },
  [UserStatus.ENABLED]: { label: '启用', color: 'success' },
  [UserStatus.DISABLED]: { label: '停用', color: 'neutral' },
}

const { data, status, refresh } = await useFetch<ResultDto<PublicUser[]>>('/api/user/list', {
  query: {
    pageIndex,
    pageSize,
  },
  default: () => ({
    success: true,
    message: '',
    data: [],
  }),
})
const { data: rolesResult } = await useFetch<ResultDto<RawRole[]>>('/api/roles', {
  default: () => ({
    success: true,
    message: '',
    data: [],
  }),
})

const users = computed(() => data.value.data ?? [])
const roles = computed(() => rolesResult.value.data ?? [])

const filteredRoles = computed(() => {
  const keyword = roleQuery.value.trim().toLowerCase()
  if (!keyword) {
    return roles.value
  }

  return roles.value.filter(role => [
    role.name,
    role.alias,
    role.desc || '',
  ].some(value => value?.toLowerCase().includes(keyword)))
})

const filteredUsers = computed(() => {
  const keyword = q.value.trim().toLowerCase()

  return users.value.filter((user) => {
    const matchKeyword = !keyword || [
      user.userId.toString(),
      user.userName,
      user.nickName,
      user.email || '',
      user.mobile || '',
    ].some(value => value.toLowerCase().includes(keyword))
    const matchStatus = statusFilter.value === 'all' || user.status === statusFilter.value

    return matchKeyword && matchStatus
  })
})

async function submitCreateUser() {
  const res = await $fetch<ResultDto<PublicUser>>('/api/user', {
    method: 'POST',
    body: normalizeCreatePayload(newUser),
  })

  if (!res.success) {
    toast.add({ title: '创建失败', description: res.message, color: 'error' })
    return
  }

  toast.add({ title: '用户已创建', description: `${res.data?.nickName || res.data?.userName} 已加入后台。`, color: 'success' })
  createOpen.value = false
  resetCreateForm()
  await refresh()
}

async function activateUser(user: PublicUser) {
  await updateUserStatus(user, 'activate')
}

async function banUser(user: PublicUser) {
  await updateUserStatus(user, 'ban')
}

function requestRemoveUser(user: PublicUser) {
  userToDelete.value = user
  deleteOpen.value = true
}

function requestAssignRoles(user: PublicUser) {
  userToAssignRoles.value = user
  roleQuery.value = ''
  selectedRoleIds.value = roles.value
    .filter(role => user.roles?.some(userRole => userRole.name === role.name || userRole.alias === role.alias))
    .map(role => role.id)
    .filter((id): id is number => id != null)
  roleOpen.value = true
}

async function confirmAssignRoles() {
  if (!userToAssignRoles.value) {
    return
  }

  roleLoading.value = true
  try {
    const res = await $fetch<ResultDto<PublicUser>>(`/api/user/${userToAssignRoles.value.userId}/roles`, {
      method: 'PUT',
      body: {
        roleIds: selectedRoleIds.value,
      },
    })

    toast.add({
      title: res.success ? '角色已更新' : '更新失败',
      description: res.message,
      color: res.success ? 'success' : 'error',
    })

    if (res.success) {
      roleOpen.value = false
      userToAssignRoles.value = undefined
      await refresh()
    }
  }
  finally {
    roleLoading.value = false
  }
}

async function confirmRemoveUser() {
  if (!userToDelete.value) {
    return
  }

  deleteLoading.value = true
  const user = userToDelete.value
  try {
    const res = await $fetch<ResultDto<boolean>>(`/api/user/${user.userId}`, {
      method: 'DELETE',
    })

    toast.add({
      title: res.success ? '用户已删除' : '删除失败',
      description: res.message,
      color: res.success ? 'success' : 'error',
    })

    if (res.success) {
      deleteOpen.value = false
      userToDelete.value = undefined
      await refresh()
    }
  }
  finally {
    deleteLoading.value = false
  }
}

function toggleSelectedRole(roleId: number | undefined, checked: boolean | 'indeterminate') {
  if (roleId == null) {
    return
  }

  if (checked && !selectedRoleIds.value.includes(roleId)) {
    selectedRoleIds.value.push(roleId)
    return
  }

  if (!checked) {
    selectedRoleIds.value = selectedRoleIds.value.filter(id => id !== roleId)
  }
}

async function updateUserStatus(user: PublicUser, action: 'activate' | 'ban') {
  const res = await $fetch<ResultDto<boolean>>(`/api/user/${action}`, {
    method: 'PUT',
    query: {
      id: user.userId,
    },
  })

  toast.add({
    title: res.success ? (action === 'activate' ? '用户已激活' : '用户已禁用') : '操作失败',
    description: res.message,
    color: res.success ? 'success' : 'error',
  })

  if (res.success) {
    await refresh()
  }
}

function normalizeCreatePayload(user: RegisterUser) {
  return {
    userName: user.userName.trim(),
    nickName: user.nickName.trim(),
    passwd: user.passwd,
    mobile: user.mobile?.trim() || undefined,
    email: user.email?.trim() || undefined,
  }
}

function resetCreateForm() {
  newUser.userName = ''
  newUser.nickName = ''
  newUser.passwd = ''
  newUser.mobile = ''
  newUser.email = ''
}

function roleLabel(user: PublicUser) {
  if (!user.roles?.length) {
    return '未分配角色'
  }

  return user.roles.map(role => role.alias || role.name).join('、')
}
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="用户管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UModal v-model:open="createOpen" title="新增用户" description="调用 iszy-api 的 POST /user 创建后台用户。">
            <UButton label="新增用户" icon="i-lucide-user-plus" />

            <template #body>
              <UForm :state="newUser" class="space-y-4" @submit="submitCreateUser">
                <UFormField label="用户名" name="userName">
                  <UInput v-model="newUser.userName" placeholder="请输入用户名" class="w-full" />
                </UFormField>
                <UFormField label="昵称" name="nickName">
                  <UInput v-model="newUser.nickName" placeholder="请输入昵称" class="w-full" />
                </UFormField>
                <UFormField label="初始密码" name="passwd">
                  <UInput
                    v-model="newUser.passwd"
                    type="password"
                    placeholder="请输入初始密码"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="手机号" name="mobile">
                  <UInput v-model="newUser.mobile" placeholder="可选" class="w-full" />
                </UFormField>
                <UFormField label="邮箱" name="email">
                  <UInput v-model="newUser.email" placeholder="可选" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                  <UButton
                    label="取消"
                    color="neutral"
                    variant="subtle"
                    @click="createOpen = false"
                  />
                  <UButton label="创建" type="submit" />
                </div>
              </UForm>
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="搜索用户 ID、用户名、昵称、手机号或邮箱"
          class="w-full sm:max-w-sm"
        />

        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <USelect
            v-model="statusFilter"
            :items="statusItems"
            class="w-full sm:w-36"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
          />
          <UButton
            label="刷新"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            :loading="status === 'pending'"
            @click="refresh()"
          />
        </div>
      </div>

      <UPageCard variant="subtle" :ui="{ container: 'p-0 sm:p-0 gap-y-0' }">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[58rem] text-sm">
            <thead class="bg-elevated/50 text-muted">
              <tr>
                <th class="px-4 py-3 text-left font-medium">
                  用户
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  联系方式
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  角色
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  状态
                </th>
                <th class="px-4 py-3 text-right font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-if="status === 'pending'">
                <td colspan="5" class="px-4 py-10 text-center text-muted">
                  加载用户中...
                </td>
              </tr>
              <tr v-else-if="!filteredUsers.length">
                <td colspan="5" class="px-4 py-10 text-center text-muted">
                  暂无匹配用户
                </td>
              </tr>
              <tr v-for="user in filteredUsers" v-else :key="user.userId">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <UAvatar :alt="user.nickName || user.userName" size="md" />
                    <div class="min-w-0">
                      <p class="truncate font-medium text-highlighted">
                        {{ user.nickName || user.userName }}
                      </p>
                      <p class="truncate text-muted">
                        #{{ user.userId }} · {{ user.userName }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-muted">
                  <div class="space-y-1">
                    <p>{{ user.email || '未绑定邮箱' }}</p>
                    <p>{{ user.mobile || '未绑定手机号' }}</p>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <UBadge color="primary" variant="subtle">
                    {{ roleLabel(user) }}
                  </UBadge>
                </td>
                <td class="px-4 py-3">
                  <UBadge :color="statusMeta[user.status as UserStatus].color" variant="subtle">
                    {{ statusMeta[user.status as UserStatus].label }}
                  </UBadge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-1">
                    <UTooltip text="激活用户">
                      <UButton
                        icon="i-lucide-check-circle"
                        color="neutral"
                        variant="ghost"
                        square
                        :disabled="user.status === UserStatus.ENABLED"
                        @click="activateUser(user)"
                      />
                    </UTooltip>
                    <UTooltip text="禁用用户">
                      <UButton
                        icon="i-lucide-ban"
                        color="warning"
                        variant="ghost"
                        square
                        :disabled="user.status === UserStatus.DISABLED"
                        @click="banUser(user)"
                      />
                    </UTooltip>
                    <UTooltip text="分配角色">
                      <UButton
                        icon="i-lucide-shield-plus"
                        color="neutral"
                        variant="ghost"
                        square
                        @click="requestAssignRoles(user)"
                      />
                    </UTooltip>
                    <UTooltip text="删除用户">
                      <UButton
                        icon="i-lucide-trash"
                        color="error"
                        variant="ghost"
                        square
                        @click="requestRemoveUser(user)"
                      />
                    </UTooltip>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UPageCard>

      <UModal
        v-model:open="deleteOpen"
        title="删除用户"
        description="删除后该用户将无法继续访问后台，且该操作不可撤销。"
      >
        <template #body>
          <div class="space-y-4">
            <UAlert
              color="error"
              icon="i-lucide-triangle-alert"
              :title="`确认删除 ${userToDelete?.nickName || userToDelete?.userName || '该用户'}？`"
              :description="userToDelete ? `用户 ID：${userToDelete.userId}，用户名：${userToDelete.userName}` : undefined"
            />

            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="subtle"
                :disabled="deleteLoading"
                @click="deleteOpen = false"
              />
              <UButton
                label="确认删除"
                color="error"
                icon="i-lucide-trash"
                :loading="deleteLoading"
                @click="confirmRemoveUser"
              />
            </div>
          </div>
        </template>
      </UModal>

      <UModal
        v-model:open="roleOpen"
        title="分配角色"
        description="调用 PUT /user/:id/roles 替换该用户的完整角色集合。"
      >
        <template #body>
          <div class="space-y-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <UInput
                v-model="roleQuery"
                icon="i-lucide-search"
                placeholder="搜索角色名称、标识或说明"
                class="w-full sm:max-w-xs"
              />
              <span class="text-sm text-muted">
                已选 {{ selectedRoleIds.length }} 个角色
              </span>
            </div>

            <div class="max-h-80 overflow-y-auto pr-1">
              <div v-if="!filteredRoles.length" class="rounded-md border border-dashed border-default px-4 py-8 text-center text-sm text-muted">
                暂无匹配角色
              </div>

              <div v-else class="grid gap-2 sm:grid-cols-2">
                <label
                  v-for="role in filteredRoles"
                  :key="role.id || role.name"
                  class="flex cursor-pointer items-start gap-2 rounded-md border border-default p-3"
                >
                  <UCheckbox
                    :model-value="selectedRoleIds.includes(role.id!)"
                    @update:model-value="toggleSelectedRole(role.id, $event)"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-highlighted">{{ role.alias || role.name }}</span>
                    <span class="block truncate text-xs text-muted">{{ role.name }}</span>
                    <span
                      class="mt-1 block min-h-4 truncate text-xs text-muted"
                      :title="role.desc || undefined"
                    >
                      {{ role.desc || '' }}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="subtle"
                :disabled="roleLoading"
                @click="roleOpen = false"
              />
              <UButton
                label="保存角色"
                icon="i-lucide-shield-check"
                :loading="roleLoading"
                @click="confirmAssignRoles"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
