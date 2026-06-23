<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { RawPrivilege, RawRole, ResultDto } from '@zvonimirsun/iszy-common'

const toast = useToast()

const q = ref('')
const createOpen = ref(false)
const editOpen = ref(false)
const roleOpen = ref(false)
const deleteOpen = ref(false)
const selectedPrivilege = ref<RawPrivilege>()
const selectedRoleIds = ref<number[]>([])
const roleLoading = ref(false)
const roles = ref<RawRole[]>([])
const privilegeForm = reactive({
  type: '',
})

const permissionColumns: TableColumn<RawPrivilege>[] = [
  { accessorKey: 'id', header: '权限 ID' },
  { accessorKey: 'type', header: '权限标识' },
  { id: 'actions', header: '操作' },
]

const { data: privilegesResult, status, refresh } = await useFetch<ResultDto<RawPrivilege[]>>('/api/privileges', {
  default: () => ({ success: true, message: '', data: [] }),
})

const privileges = computed(() => privilegesResult.value.data ?? [])

const filteredPermissions = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  if (!keyword) {
    return privileges.value
  }

  return privileges.value.filter(privilege => [
    String(privilege.id ?? ''),
    privilege.type,
  ].some(value => value.toLowerCase().includes(keyword)))
})

const roleOptions = computed(() => roles.value
  .filter(role => role.id != null)
  .map(role => ({
    id: role.id!,
    label: role.alias || role.name,
    description: role.name,
  })))

function openCreatePrivilege() {
  privilegeForm.type = ''
  createOpen.value = true
}

function openEditPrivilege(privilege: RawPrivilege) {
  selectedPrivilege.value = privilege
  privilegeForm.type = privilege.type
  editOpen.value = true
}

function openDeletePrivilege(privilege: RawPrivilege) {
  selectedPrivilege.value = privilege
  deleteOpen.value = true
}

async function openRoleBinder(privilege: RawPrivilege) {
  selectedPrivilege.value = privilege
  selectedRoleIds.value = []
  roleOpen.value = true

  if (!privilege.id) {
    return
  }

  roleLoading.value = true
  try {
    roles.value = await fetchRoles()
    selectedRoleIds.value = roles.value
      .filter(role => role.privileges?.some(item => item.id === privilege.id))
      .map(role => role.id)
      .filter((id): id is number => id != null)
  }
  finally {
    roleLoading.value = false
  }
}

async function submitCreatePrivilege() {
  const res = await $fetch<ResultDto<RawPrivilege>>('/api/privileges', {
    method: 'POST',
    body: normalizePrivilegeForm(),
  })
  toast.add({ title: res.success ? '权限已创建' : '创建失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    createOpen.value = false
    await refresh()
  }
}

async function submitEditPrivilege() {
  if (!selectedPrivilege.value?.id) {
    return
  }

  const res = await $fetch<ResultDto<RawPrivilege>>(`/api/privileges/${selectedPrivilege.value.id}`, {
    method: 'PUT',
    body: normalizePrivilegeForm(),
  })
  toast.add({ title: res.success ? '权限已更新' : '更新失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    editOpen.value = false
    await refresh()
  }
}

async function confirmDeletePrivilege() {
  if (!selectedPrivilege.value?.id) {
    return
  }

  const res = await $fetch<ResultDto<boolean>>(`/api/privileges/${selectedPrivilege.value.id}`, {
    method: 'DELETE',
  })
  toast.add({ title: res.success ? '权限已删除' : '删除失败', description: res.message, color: res.success ? 'success' : 'error' })
  if (res.success) {
    deleteOpen.value = false
    await refresh()
  }
}

async function submitPrivilegeRoles() {
  if (!selectedPrivilege.value?.id) {
    return
  }

  roleLoading.value = true
  try {
    const res = await $fetch<ResultDto<RawPrivilege>>(`/api/privileges/${selectedPrivilege.value.id}/roles`, {
      method: 'PUT',
      body: {
        roleIds: selectedRoleIds.value,
      },
    })
    toast.add({ title: res.success ? '引用角色已更新' : '绑定失败', description: res.message, color: res.success ? 'success' : 'error' })
    if (res.success) {
      roleOpen.value = false
      await refresh()
    }
  }
  finally {
    roleLoading.value = false
  }
}

function normalizePrivilegeForm() {
  return {
    type: privilegeForm.type.trim(),
  }
}

async function fetchRoles() {
  const res = await $fetch<ResultDto<RawRole[]>>('/api/roles')
  return res.data ?? []
}
</script>

<template>
  <UDashboardPanel id="permissions">
    <template #header>
      <UDashboardNavbar title="权限管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton label="新增权限" icon="i-lucide-key-round" @click="openCreatePrivilege" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="搜索权限 ID 或权限标识"
          class="w-full sm:max-w-sm"
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

      <UPageCard class="min-w-0" variant="subtle" :ui="{ container: 'min-w-0 p-0 sm:p-0 gap-y-0', body: 'min-w-0' }">
        <UTable
          :data="filteredPermissions"
          :columns="permissionColumns"
          :loading="status === 'pending'"
          :ui="{
            root: 'max-w-full',
            base: 'min-w-[40rem]',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'text-center',
            td: 'align-middle border-b border-default',
            separator: 'h-0',
          }"
        >
          <template #empty>
            暂无匹配权限
          </template>

          <template #id-cell="{ row }">
            #{{ row.original.id }}
          </template>

          <template #type-cell="{ row }">
            <p class="font-medium text-highlighted">
              {{ row.original.type }}
            </p>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex flex-wrap justify-end gap-2">
              <UTooltip text="编辑权限">
                <UButton
                  label="编辑"
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  @click="openEditPrivilege(row.original)"
                />
              </UTooltip>
              <UTooltip text="绑定角色">
                <UButton
                  label="角色"
                  icon="i-lucide-shield-check"
                  color="neutral"
                  variant="ghost"
                  @click="openRoleBinder(row.original)"
                />
              </UTooltip>
              <UTooltip text="删除权限">
                <UButton
                  label="删除"
                  icon="i-lucide-trash"
                  color="error"
                  variant="ghost"
                  @click="openDeletePrivilege(row.original)"
                />
              </UTooltip>
            </div>
          </template>
        </UTable>
      </UPageCard>

      <UModal v-model:open="createOpen" title="新增权限" description="创建一个可分配给角色的权限点。">
        <template #body>
          <UForm :state="privilegeForm" class="space-y-4" @submit="submitCreatePrivilege">
            <UFormField label="权限标识" name="type">
              <UInput v-model="privilegeForm.type" placeholder="例如：user:read" class="w-full" />
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

      <UModal v-model:open="editOpen" title="编辑权限" description="调整权限点标识。">
        <template #body>
          <UForm :state="privilegeForm" class="space-y-4" @submit="submitEditPrivilege">
            <UFormField label="权限标识" name="type">
              <UInput v-model="privilegeForm.type" class="w-full" />
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

      <UModal v-model:open="roleOpen" title="绑定角色" description="为该权限选择关联角色。">
        <template #body>
          <div class="space-y-4">
            <UFormField label="角色集合" name="roles">
              <USelectMenu
                v-model="selectedRoleIds"
                multiple
                value-key="id"
                :items="roleOptions"
                :loading="roleLoading"
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
                :disabled="roleLoading"
                @click="roleOpen = false"
              />
              <UButton
                label="保存角色"
                icon="i-lucide-shield-check"
                :loading="roleLoading"
                @click="submitPrivilegeRoles"
              />
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="deleteOpen" title="删除权限" description="删除会解除该权限与角色的关联。">
        <template #body>
          <div class="space-y-4">
            <UAlert
              color="error"
              icon="i-lucide-triangle-alert"
              :title="`确认删除 ${selectedPrivilege?.type || '该权限'}？`"
              :description="selectedPrivilege ? `权限 ID：${selectedPrivilege.id}` : undefined"
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
                @click="confirmDeletePrivilege"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
