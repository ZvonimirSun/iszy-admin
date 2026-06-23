<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PublicUser, RawGroup, RawPrivilege, RawRole, ResultDto } from '@zvonimirsun/iszy-common'

const toast = useToast()

type RoleWithSystemFlags = RawRole & {
  isBuiltIn?: boolean
  isDefault?: boolean
}

const q = ref('')
const createOpen = ref(false)
const editOpen = ref(false)
const privilegeOpen = ref(false)
const userOpen = ref(false)
const groupOpen = ref(false)
const deleteOpen = ref(false)
const selectedRole = ref<RawRole>()
const selectedPrivilegeIds = ref<number[]>([])
const selectedUserIds = ref<number[]>([])
const selectedGroupIds = ref<number[]>([])
const relationLoading = ref(false)

const roleForm = reactive<{
  name: string
  alias: string
  desc: string
}>({
  name: '',
  alias: '',
  desc: '',
})

const { data: rolesResult, status: rolesStatus, refresh: refreshRoles } = await useFetch<ResultDto<RawRole[]>>('/api/roles', {
  default: () => ({ success: true, message: '', data: [] }),
})

const roles = computed(() => rolesResult.value.data ?? [])
const privileges = ref<RawPrivilege[]>([])
const groups = ref<RawGroup[]>([])
const users = ref<PublicUser[]>([])

const roleColumns: TableColumn<RawRole>[] = [
  { accessorKey: 'id', header: '角色 ID' },
  { id: 'alias', header: '角色名称' },
  { accessorKey: 'name', header: '角色标识' },
  { accessorKey: 'desc', header: '说明' },
  { id: 'flags', header: '标记' },
  { id: 'actions', header: '操作' },
]

const filteredRoles = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  if (!keyword) {
    return roles.value
  }

  return roles.value.filter(role => [
    role.name,
    role.alias,
    role.desc || '',
  ].some(value => value.toLowerCase().includes(keyword)))
})

const privilegeOptions = computed(() => privileges.value
  .filter(privilege => privilege.id != null)
  .map(privilege => ({
    id: privilege.id!,
    label: privilege.type,
    description: `#${privilege.id}`,
  })))

const userOptions = computed(() => users.value.map(user => ({
  id: user.userId,
  label: userLabel(user),
  description: `#${user.userId} · ${user.userName}`,
})))

const groupOptions = computed(() => groups.value
  .filter(group => group.id != null)
  .map(group => ({
    id: group.id!,
    label: group.alias || group.name,
    description: group.name,
  })))

function openCreateRole() {
  resetRoleForm()
  createOpen.value = true
}

function openEditRole(role: RawRole) {
  if (guardBuiltInRole(role, '编辑')) {
    return
  }

  selectedRole.value = role
  roleForm.name = role.name
  roleForm.alias = role.alias
  roleForm.desc = role.desc || ''
  editOpen.value = true
}

async function openPrivilegeEditor(role: RawRole) {
  selectedRole.value = role
  selectedPrivilegeIds.value = []
  privilegeOpen.value = true
  relationLoading.value = true

  try {
    const [roleDetail, privilegeList] = await Promise.all([
      $fetch<ResultDto<RawRole>>(`/api/roles/${role.id}`),
      $fetch<ResultDto<RawPrivilege[]>>('/api/privileges'),
    ])
    privileges.value = privilegeList.data ?? []
    selectedPrivilegeIds.value = roleDetail.data?.privileges?.map(privilege => privilege.id).filter((id): id is number => id != null) ?? []
  }
  finally {
    relationLoading.value = false
  }
}

async function openUserBinder(role: RawRole) {
  if (guardDefaultRoleUsers(role)) {
    return
  }

  selectedRole.value = role
  selectedUserIds.value = []
  userOpen.value = true
  relationLoading.value = true

  try {
    users.value = await fetchUsers()
    const userDetails = await fetchListedUserDetails()
    selectedUserIds.value = userDetails
      .filter(user => user.roles?.some(userRole => isSameRole(role, userRole)))
      .map(user => user.userId)
  }
  finally {
    relationLoading.value = false
  }
}

async function openGroupBinder(role: RawRole) {
  selectedRole.value = role
  selectedGroupIds.value = []
  groupOpen.value = true
  relationLoading.value = true

  try {
    groups.value = await fetchGroups()
    selectedGroupIds.value = groups.value
      .filter(group => group.roles?.some(groupRole => isSameRole(role, groupRole)))
      .map(group => group.id)
      .filter((id): id is number => id != null)
  }
  finally {
    relationLoading.value = false
  }
}

function openDeleteRole(role: RawRole) {
  if (guardBuiltInRole(role, '删除')) {
    return
  }

  selectedRole.value = role
  deleteOpen.value = true
}

async function submitCreateRole() {
  const res = await $fetch<ResultDto<RawRole>>('/api/roles', {
    method: 'POST',
    body: normalizeRoleForm(),
  })
  toast.add({ title: res.success ? '角色已创建' : '创建失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    createOpen.value = false
    await refreshRoles()
  }
}

async function submitEditRole() {
  if (!selectedRole.value?.id) {
    return
  }
  if (guardBuiltInRole(selectedRole.value, '编辑')) {
    editOpen.value = false
    return
  }

  const res = await $fetch<ResultDto<RawRole>>(`/api/roles/${selectedRole.value.id}`, {
    method: 'PUT',
    body: normalizeRoleForm(),
  })
  toast.add({ title: res.success ? '角色已更新' : '更新失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    editOpen.value = false
    await refreshRoles()
  }
}

async function submitRolePrivileges() {
  if (!selectedRole.value?.id) {
    return
  }

  const res = await $fetch<ResultDto<RawRole>>(`/api/roles/${selectedRole.value.id}/privileges`, {
    method: 'PUT',
    body: {
      privilegeIds: selectedPrivilegeIds.value,
    },
  })
  toast.add({ title: res.success ? '授权已更新' : '授权失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    privilegeOpen.value = false
    await refreshRoles()
  }
}

async function submitRoleUsers() {
  if (!selectedRole.value?.id) {
    return
  }

  relationLoading.value = true
  try {
    const res = await $fetch<ResultDto<RawRole>>(`/api/roles/${selectedRole.value.id}/users`, {
      method: 'PUT',
      body: {
        userIds: selectedUserIds.value,
      },
    })
    toast.add({ title: res.success ? '用户绑定已更新' : '绑定失败', description: res.message, color: res.success ? 'success' : 'error' })
    if (res.success) {
      userOpen.value = false
    }
  }
  finally {
    relationLoading.value = false
  }
}

async function submitRoleGroups() {
  if (!selectedRole.value?.id) {
    return
  }

  relationLoading.value = true
  try {
    const res = await $fetch<ResultDto<RawRole>>(`/api/roles/${selectedRole.value.id}/groups`, {
      method: 'PUT',
      body: {
        groupIds: selectedGroupIds.value,
      },
    })
    toast.add({ title: res.success ? '用户组绑定已更新' : '绑定失败', description: res.message, color: res.success ? 'success' : 'error' })
    if (res.success) {
      groupOpen.value = false
    }
  }
  finally {
    relationLoading.value = false
  }
}

async function confirmDeleteRole() {
  if (!selectedRole.value?.id) {
    return
  }
  if (guardBuiltInRole(selectedRole.value, '删除')) {
    deleteOpen.value = false
    return
  }

  const res = await $fetch<ResultDto<boolean>>(`/api/roles/${selectedRole.value.id}`, {
    method: 'DELETE',
  })
  toast.add({ title: res.success ? '角色已删除' : '删除失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    deleteOpen.value = false
    await refreshRoles()
  }
}

function isBuiltInRole(role: RawRole): role is RoleWithSystemFlags {
  return (role as RoleWithSystemFlags).isBuiltIn === true
}

function isDefaultRole(role: RawRole): role is RoleWithSystemFlags {
  return (role as RoleWithSystemFlags).isDefault === true
}

function guardBuiltInRole(role: RawRole, action: string) {
  if (!isBuiltInRole(role)) {
    return false
  }

  toast.add({
    title: `内置角色不可${action}`,
    description: '该角色由系统初始化逻辑维护，不能在前端修改。',
    color: 'warning',
  })
  return true
}

function guardDefaultRoleUsers(role: RawRole) {
  if (!isDefaultRole(role)) {
    return false
  }

  toast.add({
    title: '默认角色不可绑定用户',
    description: '注册用户为系统默认角色，用户绑定由系统自动维护。',
    color: 'warning',
  })
  return true
}

function normalizeRoleForm() {
  return {
    name: roleForm.name.trim(),
    alias: roleForm.alias.trim(),
    desc: roleForm.desc.trim() || undefined,
  }
}

function resetRoleForm() {
  roleForm.name = ''
  roleForm.alias = ''
  roleForm.desc = ''
}

function userLabel(user: PublicUser) {
  return user.nickName || user.userName
}

function isSameRole(role: RawRole, targetRole: RawRole) {
  return (role.id != null && targetRole.id != null && role.id === targetRole.id)
    || role.name === targetRole.name
    || role.alias === targetRole.alias
}

async function fetchListedUserDetails() {
  const results = await Promise.allSettled(users.value.map(user => $fetch<ResultDto<PublicUser>>(`/api/user/${user.userId}`)))
  return results
    .filter((result): result is PromiseFulfilledResult<ResultDto<PublicUser>> => result.status === 'fulfilled' && !!result.value.data)
    .map(result => result.value.data!)
}

async function fetchUsers() {
  const res = await $fetch<ResultDto<PublicUser[]>>('/api/user/list', {
    query: { pageIndex: 1, pageSize: 100 },
  })
  return res.data ?? []
}

async function fetchGroups() {
  const res = await $fetch<ResultDto<RawGroup[]>>('/api/groups')
  return res.data ?? []
}
</script>

<template>
  <UDashboardPanel id="roles">
    <template #header>
      <UDashboardNavbar title="角色管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton label="新增角色" icon="i-lucide-shield-plus" @click="openCreateRole" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="搜索角色名称、别名或说明"
          class="w-full sm:max-w-sm"
        />
        <UButton
          label="刷新"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="rolesStatus === 'pending'"
          @click="refreshRoles()"
        />
      </div>

      <UPageCard class="min-w-0" variant="subtle" :ui="{ container: 'min-w-0 p-0 sm:p-0 gap-y-0', body: 'min-w-0' }">
        <UTable
          :data="filteredRoles"
          :columns="roleColumns"
          :loading="rolesStatus === 'pending'"
          :ui="{
            root: 'max-w-full',
            base: 'min-w-[60rem]',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'text-center',
            td: 'align-middle border-b border-default',
            separator: 'h-0',
          }"
        >
          <template #empty>
            暂无匹配角色
          </template>

          <template #id-cell="{ row }">
            #{{ row.original.id }}
          </template>

          <template #alias-cell="{ row }">
            <p class="font-medium text-highlighted">
              {{ row.original.alias || row.original.name }}
            </p>
          </template>

          <template #desc-cell="{ row }">
            {{ row.original.desc || '暂无角色说明' }}
          </template>

          <template #flags-cell="{ row }">
            <div class="flex flex-wrap gap-1.5">
              <UBadge v-if="isBuiltInRole(row.original)" color="neutral" variant="outline">
                内置角色
              </UBadge>
              <UBadge v-if="isDefaultRole(row.original)" color="neutral" variant="subtle">
                默认角色
              </UBadge>
              <span v-if="!isBuiltInRole(row.original) && !isDefaultRole(row.original)" class="text-muted">普通角色</span>
            </div>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex flex-wrap justify-end gap-2">
              <UButton
                v-if="!isBuiltInRole(row.original)"
                label="编辑"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                @click="openEditRole(row.original)"
              />
              <UButton
                v-if="!isBuiltInRole(row.original)"
                label="删除"
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                @click="openDeleteRole(row.original)"
              />
              <UButton
                v-if="!isDefaultRole(row.original)"
                label="用户"
                icon="i-lucide-users"
                color="neutral"
                variant="ghost"
                @click="openUserBinder(row.original)"
              />
              <UButton
                label="用户组"
                icon="i-lucide-panels-top-left"
                color="neutral"
                variant="ghost"
                @click="openGroupBinder(row.original)"
              />
              <UButton
                label="授权"
                icon="i-lucide-key-round"
                color="neutral"
                variant="ghost"
                @click="openPrivilegeEditor(row.original)"
              />
            </div>
          </template>
        </UTable>
      </UPageCard>

      <UModal v-model:open="createOpen" title="新增角色" description="创建一个可用于用户、用户组和权限配置的角色。">
        <template #body>
          <UForm :state="roleForm" class="space-y-4" @submit="submitCreateRole">
            <UFormField label="角色标识" name="name">
              <UInput v-model="roleForm.name" placeholder="例如：ops_admin" class="w-full" />
            </UFormField>
            <UFormField label="角色名称" name="alias">
              <UInput v-model="roleForm.alias" placeholder="例如：运营管理员" class="w-full" />
            </UFormField>
            <UFormField label="角色说明" name="desc">
              <UTextarea v-model="roleForm.desc" placeholder="描述该角色的职责边界" class="w-full" />
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

      <UModal v-model:open="editOpen" title="编辑角色" description="调整角色标识、名称和说明。">
        <template #body>
          <UForm :state="roleForm" class="space-y-4" @submit="submitEditRole">
            <UFormField label="角色标识" name="name">
              <UInput v-model="roleForm.name" class="w-full" />
            </UFormField>
            <UFormField label="角色名称" name="alias">
              <UInput v-model="roleForm.alias" class="w-full" />
            </UFormField>
            <UFormField label="角色说明" name="desc">
              <UTextarea v-model="roleForm.desc" class="w-full" />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="subtle"
                @click="editOpen = false"
              />
              <UButton label="保存" type="submit" />
            </div>
          </UForm>
        </template>
      </UModal>

      <UModal v-model:open="privilegeOpen" title="角色授权" description="为该角色选择权限集合。">
        <template #body>
          <div class="space-y-4">
            <UFormField label="权限集合" name="privileges">
              <USelectMenu
                v-model="selectedPrivilegeIds"
                multiple
                value-key="id"
                :items="privilegeOptions"
                :loading="relationLoading"
                :search-input="{ placeholder: '搜索权限标识', icon: 'i-lucide-search' }"
                placeholder="选择权限"
                class="w-full"
              />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="subtle"
                @click="privilegeOpen = false"
              />
              <UButton label="保存授权" icon="i-lucide-key-round" @click="submitRolePrivileges" />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="userOpen" title="绑定用户" description="为该角色选择关联用户。">
        <template #body>
          <div class="space-y-4">
            <UFormField label="用户集合" name="users">
              <USelectMenu
                v-model="selectedUserIds"
                multiple
                value-key="id"
                :items="userOptions"
                :loading="relationLoading"
                :search-input="{ placeholder: '搜索用户', icon: 'i-lucide-search' }"
                placeholder="选择用户"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="subtle"
                :disabled="relationLoading"
                @click="userOpen = false"
              />
              <UButton
                label="保存用户"
                icon="i-lucide-users"
                :loading="relationLoading"
                @click="submitRoleUsers"
              />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="groupOpen" title="绑定用户组" description="为该角色选择关联用户组。">
        <template #body>
          <div class="space-y-4">
            <UFormField label="用户组集合" name="groups">
              <USelectMenu
                v-model="selectedGroupIds"
                multiple
                value-key="id"
                :items="groupOptions"
                :loading="relationLoading"
                :search-input="{ placeholder: '搜索用户组', icon: 'i-lucide-search' }"
                placeholder="选择用户组"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="subtle"
                :disabled="relationLoading"
                @click="groupOpen = false"
              />
              <UButton
                label="保存用户组"
                icon="i-lucide-panels-top-left"
                :loading="relationLoading"
                @click="submitRoleGroups"
              />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="deleteOpen" title="删除角色" description="删除会解除该角色与用户、用户组、权限的关联。">
        <template #body>
          <div class="space-y-4">
            <UAlert
              color="error"
              icon="i-lucide-triangle-alert"
              :title="`确认删除 ${selectedRole?.alias || selectedRole?.name || '该角色'}？`"
              :description="selectedRole ? `角色标识：${selectedRole.name}` : undefined"
            />
            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="subtle"
                @click="deleteOpen = false"
              />
              <UButton
                label="确认删除"
                color="error"
                icon="i-lucide-trash"
                @click="confirmDeleteRole"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
