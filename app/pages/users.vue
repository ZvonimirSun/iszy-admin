<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PublicUser, RawRole, RegisterUser, ResultDto } from '@zvonimirsun/iszy-common'
import { UserStatus } from '@zvonimirsun/iszy-common'

const toast = useToast()

type RoleWithSystemFlags = RawRole & {
  isDefault?: boolean
}

const q = ref('')
const statusFilter = ref<'all' | UserStatus>('all')
const createOpen = ref(false)
const deleteOpen = ref(false)
const deleteLoading = ref(false)
const userToDelete = ref<PublicUser>()
const roleOpen = ref(false)
const roleLoading = ref(false)
const roleDetailLoading = ref(false)
const userToAssignRoles = ref<PublicUser>()
const selectedRoleIds = ref<number[]>([])
const roles = ref<RawRole[]>([])
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

const userColumns: TableColumn<PublicUser>[] = [
  { accessorKey: 'userId', header: '用户 ID' },
  { id: 'user', header: '用户' },
  { accessorKey: 'userName', header: '用户名' },
  { id: 'contact', header: '联系方式' },
  { accessorKey: 'status', header: '状态' },
  { id: 'actions', header: '操作' },
]

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
const users = computed(() => data.value.data ?? [])
const defaultRoleIds = computed(() => roles.value
  .filter(isDefaultRole)
  .map(role => role.id)
  .filter((id): id is number => id != null))

const roleOptions = computed(() => roles.value
  .filter(role => role.id != null)
  .map(role => ({
    id: role.id!,
    label: role.alias || role.name,
    description: isRequiredRole(role)
      ? `${role.name} · 默认角色`
      : role.desc || role.name,
    disabled: isRequiredRole(role),
  })))

const selectedRoleModel = computed<number[]>({
  get: () => selectedRoleIds.value,
  set: (roleIds) => {
    selectedRoleIds.value = withDefaultRoleIds(roleIds)
  },
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

async function requestAssignRoles(user: PublicUser) {
  userToAssignRoles.value = user
  selectedRoleIds.value = []
  roleOpen.value = true
  roleDetailLoading.value = true

  try {
    const [roleList, res] = await Promise.all([
      fetchRoles(),
      $fetch<ResultDto<PublicUser>>(`/api/user/${user.userId}`),
    ])
    roles.value = roleList
    if (!res.success || !res.data) {
      toast.add({ title: '角色加载失败', description: res.message, color: 'error' })
      return
    }

    userToAssignRoles.value = res.data
    selectedRoleIds.value = withDefaultRoleIds(roles.value
      .filter(role => res.data?.roles?.some(userRole => isSameRole(role, userRole)))
      .map(role => role.id)
      .filter((id): id is number => id != null))
  }
  finally {
    roleDetailLoading.value = false
  }
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
        roleIds: withDefaultRoleIds(selectedRoleIds.value),
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

function withDefaultRoleIds(roleIds: number[]) {
  return Array.from(new Set([...roleIds, ...defaultRoleIds.value]))
}

function isRequiredRole(role: RawRole) {
  return role.id != null && defaultRoleIds.value.includes(role.id)
}

function isDefaultRole(role: RawRole): role is RoleWithSystemFlags {
  return (role as RoleWithSystemFlags).isDefault === true
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

function isSameRole(role: RawRole, userRole: RawRole) {
  return (role.id != null && userRole.id != null && role.id === userRole.id)
    || role.name === userRole.name
    || role.alias === userRole.alias
}

async function fetchRoles() {
  const res = await $fetch<ResultDto<RawRole[]>>('/api/roles')
  return res.data ?? []
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
          <UModal v-model:open="createOpen" title="新增用户" description="创建一个可登录后台的用户。">
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

      <UPageCard class="min-w-0" variant="subtle" :ui="{ container: 'min-w-0 p-0 sm:p-0 gap-y-0', body: 'min-w-0' }">
        <UTable
          :data="filteredUsers"
          :columns="userColumns"
          :loading="status === 'pending'"
          :ui="{
            root: 'max-w-full',
            base: 'min-w-[58rem]',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'text-center',
            td: 'align-middle border-b border-default',
            separator: 'h-0',
          }"
        >
          <template #empty>
            暂无匹配用户
          </template>

          <template #userId-cell="{ row }">
            #{{ row.original.userId }}
          </template>

          <template #user-cell="{ row }">
            <div class="flex items-center gap-3">
              <UAvatar :alt="row.original.nickName || row.original.userName" size="md" />
              <div class="min-w-0">
                <p class="truncate font-medium text-highlighted">
                  {{ row.original.nickName || row.original.userName }}
                </p>
              </div>
            </div>
          </template>

          <template #contact-cell="{ row }">
            <div class="space-y-1">
              <p>{{ row.original.email || '未绑定邮箱' }}</p>
              <p>{{ row.original.mobile || '未绑定手机号' }}</p>
            </div>
          </template>

          <template #status-cell="{ row }">
            <UBadge :color="statusMeta[row.original.status as UserStatus].color" variant="subtle">
              {{ statusMeta[row.original.status as UserStatus].label }}
            </UBadge>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex flex-wrap justify-end gap-2">
              <UTooltip text="激活用户">
                <UButton
                  label="激活"
                  icon="i-lucide-check-circle"
                  color="neutral"
                  variant="ghost"
                  :disabled="row.original.status === UserStatus.ENABLED"
                  @click="activateUser(row.original)"
                />
              </UTooltip>
              <UTooltip text="禁用用户">
                <UButton
                  label="禁用"
                  icon="i-lucide-ban"
                  color="warning"
                  variant="ghost"
                  :disabled="row.original.status === UserStatus.DISABLED"
                  @click="banUser(row.original)"
                />
              </UTooltip>
              <UTooltip text="分配角色">
                <UButton
                  label="角色"
                  icon="i-lucide-shield-plus"
                  color="neutral"
                  variant="ghost"
                  @click="requestAssignRoles(row.original)"
                />
              </UTooltip>
              <UTooltip text="删除用户">
                <UButton
                  label="删除"
                  icon="i-lucide-trash"
                  color="error"
                  variant="ghost"
                  @click="requestRemoveUser(row.original)"
                />
              </UTooltip>
            </div>
          </template>
        </UTable>
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
        description="为该用户选择角色集合。"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="角色集合" name="roles">
              <USelectMenu
                v-model="selectedRoleModel"
                multiple
                value-key="id"
                :items="roleOptions"
                :loading="roleDetailLoading"
                :search-input="{ placeholder: '搜索角色', icon: 'i-lucide-search' }"
                placeholder="选择角色"
                class="w-full"
              />
            </UFormField>

            <p v-if="defaultRoleIds.length" class="text-sm text-muted">
              默认角色会自动保留。
            </p>

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
                :disabled="roleDetailLoading"
                @click="confirmAssignRoles"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
