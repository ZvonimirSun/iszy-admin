<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PublicUser, RawGroup, RawRole, ResultDto } from '@zvonimirsun/iszy-common'

const toast = useToast()

const q = ref('')
const createOpen = ref(false)
const editOpen = ref(false)
const roleOpen = ref(false)
const userOpen = ref(false)
const deleteOpen = ref(false)
const relationLoading = ref(false)
const selectedGroup = ref<RawGroup>()
const selectedRoleIds = ref<number[]>([])
const selectedUserIds = ref<number[]>([])
const roles = ref<RawRole[]>([])
const users = ref<PublicUser[]>([])

const groupForm = reactive<{
  name: string
  alias: string
  parentId: number | undefined
}>({
  name: '',
  alias: '',
  parentId: undefined,
})

const { data: groupsResult, status, refresh: refreshGroups } = await useFetch<ResultDto<RawGroup[]>>('/api/groups', {
  default: () => ({ success: true, message: '', data: [] }),
})

const groups = computed(() => groupsResult.value.data ?? [])

const groupColumns: TableColumn<RawGroup>[] = [
  { accessorKey: 'id', header: '用户组 ID' },
  { id: 'alias', header: '用户组名称' },
  { accessorKey: 'name', header: '用户组标识' },
  { accessorKey: 'parentId', header: '父级' },
  { id: 'actions', header: '操作' },
]

const filteredGroups = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  if (!keyword) {
    return groups.value
  }

  return groups.value.filter(group => [
    group.name,
    group.alias,
    String(group.id ?? ''),
  ].some(value => value.toLowerCase().includes(keyword)))
})

const roleOptions = computed(() => roles.value
  .filter(role => role.id != null)
  .map(role => ({
    id: role.id!,
    label: role.alias || role.name,
    description: role.name,
  })))

const userOptions = computed(() => users.value.map(user => ({
  id: user.userId,
  label: userLabel(user),
  description: `#${user.userId} · ${user.userName}`,
})))

function openCreateGroup() {
  resetGroupForm()
  createOpen.value = true
}

function openEditGroup(group: RawGroup) {
  selectedGroup.value = group
  groupForm.name = group.name
  groupForm.alias = group.alias
  groupForm.parentId = group.parentId
  editOpen.value = true
}

async function openRoleBinder(group: RawGroup) {
  selectedGroup.value = group
  selectedRoleIds.value = []
  roleOpen.value = true
  relationLoading.value = true

  try {
    const [groupDetail, roleList] = await Promise.all([
      group.id ? $fetch<ResultDto<RawGroup>>(`/api/groups/${group.id}`) : Promise.resolve({ success: true, message: '', data: group } satisfies ResultDto<RawGroup>),
      fetchRoles(),
    ])
    roles.value = roleList
    selectedRoleIds.value = groupDetail.data?.roles?.map(role => role.id).filter((id): id is number => id != null) ?? []
  }
  finally {
    relationLoading.value = false
  }
}

async function openUserBinder(group: RawGroup) {
  selectedGroup.value = group
  selectedUserIds.value = []
  userOpen.value = true
  relationLoading.value = true

  try {
    users.value = await fetchUsers()
    const userDetails = await fetchListedUserDetails()
    selectedUserIds.value = userDetails
      .filter(user => user.groups?.some(userGroup => isSameGroup(group, userGroup)))
      .map(user => user.userId)
  }
  finally {
    relationLoading.value = false
  }
}

function openDeleteGroup(group: RawGroup) {
  selectedGroup.value = group
  deleteOpen.value = true
}

async function submitCreateGroup() {
  const res = await $fetch<ResultDto<RawGroup>>('/api/groups', {
    method: 'POST',
    body: normalizeGroupForm(),
  })
  toast.add({ title: res.success ? '用户组已创建' : '创建失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    createOpen.value = false
    await refreshGroups()
  }
}

async function submitEditGroup() {
  if (!selectedGroup.value?.id) {
    return
  }

  const res = await $fetch<ResultDto<RawGroup>>(`/api/groups/${selectedGroup.value.id}`, {
    method: 'PUT',
    body: normalizeGroupForm(),
  })
  toast.add({ title: res.success ? '用户组已更新' : '更新失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    editOpen.value = false
    await refreshGroups()
  }
}

async function submitGroupRoles() {
  if (!selectedGroup.value?.id) {
    return
  }

  relationLoading.value = true
  try {
    const res = await $fetch<ResultDto<RawGroup>>(`/api/groups/${selectedGroup.value.id}/roles`, {
      method: 'PUT',
      body: {
        roleIds: selectedRoleIds.value,
      },
    })
    toast.add({ title: res.success ? '角色绑定已更新' : '绑定失败', description: res.message, color: res.success ? 'success' : 'error' })
    if (res.success) {
      roleOpen.value = false
      await refreshGroups()
    }
  }
  finally {
    relationLoading.value = false
  }
}

async function submitGroupUsers() {
  if (!selectedGroup.value?.id) {
    return
  }

  relationLoading.value = true
  try {
    const res = await $fetch<ResultDto<RawGroup>>(`/api/groups/${selectedGroup.value.id}/users`, {
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

async function confirmDeleteGroup() {
  if (!selectedGroup.value?.id) {
    return
  }

  const res = await $fetch<ResultDto<boolean>>(`/api/groups/${selectedGroup.value.id}`, {
    method: 'DELETE',
  })
  toast.add({ title: res.success ? '用户组已删除' : '删除失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    deleteOpen.value = false
    await refreshGroups()
  }
}

function normalizeGroupForm() {
  return {
    name: groupForm.name.trim(),
    alias: groupForm.alias.trim(),
    parentId: groupForm.parentId || undefined,
  }
}

function resetGroupForm() {
  groupForm.name = ''
  groupForm.alias = ''
  groupForm.parentId = undefined
}

function groupLabel(group: RawGroup) {
  return group.alias || group.name
}

function userLabel(user: PublicUser) {
  return user.nickName || user.userName
}

function isSameGroup(group: RawGroup, targetGroup: RawGroup) {
  return (group.id != null && targetGroup.id != null && group.id === targetGroup.id)
    || group.name === targetGroup.name
    || group.alias === targetGroup.alias
}

async function fetchListedUserDetails() {
  const results = await Promise.allSettled(users.value.map(user => $fetch<ResultDto<PublicUser>>(`/api/user/${user.userId}`)))
  return results
    .filter((result): result is PromiseFulfilledResult<ResultDto<PublicUser>> => result.status === 'fulfilled' && !!result.value.data)
    .map(result => result.value.data!)
}

async function fetchRoles() {
  const res = await $fetch<ResultDto<RawRole[]>>('/api/roles')
  return res.data ?? []
}

async function fetchUsers() {
  const res = await $fetch<ResultDto<PublicUser[]>>('/api/user/list', {
    query: { pageIndex: 1, pageSize: 100 },
  })
  return res.data ?? []
}
</script>

<template>
  <UDashboardPanel id="groups">
    <template #header>
      <UDashboardNavbar title="用户组管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton label="新增用户组" icon="i-lucide-panels-top-left" @click="openCreateGroup" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="搜索用户组 ID、名称或标识"
          class="w-full sm:max-w-sm"
        />
        <UButton
          label="刷新"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="status === 'pending'"
          @click="refreshGroups()"
        />
      </div>

      <UPageCard class="min-w-0" variant="subtle" :ui="{ container: 'min-w-0 p-0 sm:p-0 gap-y-0', body: 'min-w-0' }">
        <UTable
          :data="filteredGroups"
          :columns="groupColumns"
          :loading="status === 'pending'"
          :ui="{
            root: 'max-w-full',
            base: 'min-w-[56rem]',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'text-center',
            td: 'align-middle border-b border-default',
            separator: 'h-0',
          }"
        >
          <template #empty>
            暂无匹配用户组
          </template>

          <template #id-cell="{ row }">
            #{{ row.original.id }}
          </template>

          <template #alias-cell="{ row }">
            <p class="font-medium text-highlighted">
              {{ groupLabel(row.original) }}
            </p>
          </template>

          <template #parentId-cell="{ row }">
            {{ row.original.parentId ? `#${row.original.parentId}` : '无' }}
          </template>

          <template #actions-cell="{ row }">
            <div class="flex flex-wrap justify-end gap-2">
              <UButton
                label="用户"
                icon="i-lucide-users"
                color="neutral"
                variant="ghost"
                @click="openUserBinder(row.original)"
              />
              <UButton
                label="角色"
                icon="i-lucide-shield-check"
                color="neutral"
                variant="ghost"
                @click="openRoleBinder(row.original)"
              />
              <UButton
                label="编辑"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                @click="openEditGroup(row.original)"
              />
              <UButton
                label="删除"
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                @click="openDeleteGroup(row.original)"
              />
            </div>
          </template>
        </UTable>
      </UPageCard>

      <UModal v-model:open="createOpen" title="新增用户组" description="创建一个可用于用户归属和角色配置的用户组。">
        <template #body>
          <UForm :state="groupForm" class="space-y-4" @submit="submitCreateGroup">
            <UFormField label="用户组标识" name="name">
              <UInput v-model="groupForm.name" placeholder="例如：ops_team" class="w-full" />
            </UFormField>
            <UFormField label="用户组名称" name="alias">
              <UInput v-model="groupForm.alias" placeholder="例如：运营团队" class="w-full" />
            </UFormField>
            <UFormField label="父级用户组 ID" name="parentId">
              <UInput
                v-model.number="groupForm.parentId"
                type="number"
                placeholder="可选"
                class="w-full"
              />
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

      <UModal v-model:open="editOpen" title="编辑用户组" description="调整用户组标识、名称和父级关系。">
        <template #body>
          <UForm :state="groupForm" class="space-y-4" @submit="submitEditGroup">
            <UFormField label="用户组标识" name="name">
              <UInput v-model="groupForm.name" class="w-full" />
            </UFormField>
            <UFormField label="用户组名称" name="alias">
              <UInput v-model="groupForm.alias" class="w-full" />
            </UFormField>
            <UFormField label="父级用户组 ID" name="parentId">
              <UInput
                v-model.number="groupForm.parentId"
                type="number"
                placeholder="可选"
                class="w-full"
              />
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

      <UModal v-model:open="roleOpen" title="绑定角色" description="为该用户组选择关联角色。">
        <template #body>
          <div class="space-y-4">
            <UFormField label="角色集合" name="roles">
              <USelectMenu
                v-model="selectedRoleIds"
                multiple
                value-key="id"
                :items="roleOptions"
                :loading="relationLoading"
                :search-input="{ placeholder: '搜索角色', icon: 'i-lucide-search' }"
                placeholder="选择角色"
                class="w-full"
              />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton
                label="取消"
                color="neutral"
                variant="subtle"
                :disabled="relationLoading"
                @click="roleOpen = false"
              />
              <UButton
                label="保存角色"
                icon="i-lucide-shield-check"
                :loading="relationLoading"
                @click="submitGroupRoles"
              />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="userOpen" title="绑定用户" description="为该用户组选择关联用户。">
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
                @click="submitGroupUsers"
              />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="deleteOpen" title="删除用户组" description="删除会解除该用户组与用户、角色的关联。">
        <template #body>
          <div class="space-y-4">
            <UAlert
              color="error"
              icon="i-lucide-triangle-alert"
              :title="`确认删除 ${selectedGroup?.alias || selectedGroup?.name || '该用户组'}？`"
              :description="selectedGroup ? `用户组标识：${selectedGroup.name}` : undefined"
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
                @click="confirmDeleteGroup"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
