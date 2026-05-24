<script setup lang="ts">
import type { PublicUser, RawPrivilege, RawRole, ResultDto } from '@zvonimirsun/iszy-common'

const toast = useToast()

const q = ref('')
const createOpen = ref(false)
const editOpen = ref(false)
const privilegeOpen = ref(false)
const deleteOpen = ref(false)
const selectedRole = ref<RawRole>()
const selectedPrivilegeIds = ref<number[]>([])

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
const { data: privilegesResult } = await useFetch<ResultDto<RawPrivilege[]>>('/api/privileges', {
  default: () => ({ success: true, message: '', data: [] }),
})
const { data: usersResult } = await useFetch<ResultDto<PublicUser[]>>('/api/user/list', {
  query: { pageIndex: 1, pageSize: 100 },
  default: () => ({ success: true, message: '', data: [] }),
})

const roles = computed(() => rolesResult.value.data ?? [])
const privileges = computed(() => privilegesResult.value.data ?? [])
const users = computed(() => usersResult.value.data ?? [])

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

function openCreateRole() {
  resetRoleForm()
  createOpen.value = true
}

function openEditRole(role: RawRole) {
  selectedRole.value = role
  roleForm.name = role.name
  roleForm.alias = role.alias
  roleForm.desc = role.desc || ''
  editOpen.value = true
}

function openPrivilegeEditor(role: RawRole) {
  selectedRole.value = role
  selectedPrivilegeIds.value = role.privileges?.map(privilege => privilege.id).filter((id): id is number => id != null) ?? []
  privilegeOpen.value = true
}

function openDeleteRole(role: RawRole) {
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

async function confirmDeleteRole() {
  if (!selectedRole.value?.id) {
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

function togglePrivilege(privilegeId: number | undefined, checked: boolean | 'indeterminate') {
  if (privilegeId == null) {
    return
  }

  if (checked && !selectedPrivilegeIds.value.includes(privilegeId)) {
    selectedPrivilegeIds.value.push(privilegeId)
    return
  }

  if (!checked) {
    selectedPrivilegeIds.value = selectedPrivilegeIds.value.filter(id => id !== privilegeId)
  }
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

function userCount(role: RawRole) {
  return users.value.filter(user => user.roles?.some(userRole => userRole.name === role.name || userRole.alias === role.alias)).length
}

function privilegeLabel(privilege: RawPrivilege) {
  return privilege.type
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

      <div class="grid gap-4 xl:grid-cols-3">
        <UPageCard
          v-for="role in filteredRoles"
          :key="role.id"
          :title="role.alias || role.name"
          :description="role.desc || '暂无角色说明'"
          variant="subtle"
          :ui="{ footer: 'border-t border-default pt-4' }"
        >
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <UBadge color="neutral" variant="subtle">
                {{ role.name }}
              </UBadge>
              <UBadge color="primary" variant="subtle">
                {{ userCount(role) }} 名用户
              </UBadge>
              <UBadge color="success" variant="subtle">
                {{ role.privileges?.length || 0 }} 项权限
              </UBadge>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="privilege in role.privileges?.slice(0, 5)"
                :key="privilege.id || privilege.type"
                color="neutral"
                variant="outline"
              >
                {{ privilegeLabel(privilege) }}
              </UBadge>
              <UBadge v-if="(role.privileges?.length || 0) > 5" color="neutral" variant="outline">
                +{{ (role.privileges?.length || 0) - 5 }}
              </UBadge>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                label="编辑"
                icon="i-lucide-pencil"
                color="neutral"
                variant="subtle"
                @click="openEditRole(role)"
              />
              <UButton label="授权" icon="i-lucide-key-round" @click="openPrivilegeEditor(role)" />
              <UButton
                label="删除"
                icon="i-lucide-trash"
                color="error"
                variant="subtle"
                @click="openDeleteRole(role)"
              />
            </div>
          </template>
        </UPageCard>
      </div>

      <UModal v-model:open="createOpen" title="新增角色" description="调用 POST /roles 创建角色。">
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

      <UModal v-model:open="editOpen" title="编辑角色" description="调用 PUT /roles/:id 更新角色基础信息。">
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

      <UModal v-model:open="privilegeOpen" title="角色授权" description="调用 PUT /roles/:id/privileges 替换该角色的完整权限集合。">
        <template #body>
          <div class="space-y-4">
            <div class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="privilege in privileges"
                :key="privilege.id || privilege.type"
                class="flex cursor-pointer items-start gap-2 rounded-md border border-default p-3"
              >
                <UCheckbox
                  :model-value="selectedPrivilegeIds.includes(privilege.id!)"
                  @update:model-value="togglePrivilege(privilege.id, $event)"
                />
                <span class="min-w-0">
                  <span class="block text-sm font-medium text-highlighted">{{ privilege.type }}</span>
                  <span class="block truncate text-xs text-muted">#{{ privilege.id }}</span>
                </span>
              </label>
            </div>
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
