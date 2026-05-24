<script setup lang="ts">
import type { RawPrivilege, RawRole, ResultDto } from '@zvonimirsun/iszy-common'

const toast = useToast()

const q = ref('')
const createOpen = ref(false)
const editOpen = ref(false)
const deleteOpen = ref(false)
const selectedPrivilege = ref<RawPrivilege>()
const privilegeForm = reactive({
  type: '',
})

const { data: privilegesResult, status, refresh } = await useFetch<ResultDto<RawPrivilege[]>>('/api/privileges', {
  default: () => ({ success: true, message: '', data: [] }),
})
const { data: rolesResult } = await useFetch<ResultDto<RawRole[]>>('/api/roles', {
  default: () => ({ success: true, message: '', data: [] }),
})

const privileges = computed(() => privilegesResult.value.data ?? [])
const roles = computed(() => rolesResult.value.data ?? [])

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

function normalizePrivilegeForm() {
  return {
    type: privilegeForm.type.trim(),
  }
}

function referencedRoles(privilege: RawPrivilege) {
  if (!privilege.id) {
    return []
  }

  return roles.value.filter(role => role.privileges?.some(item => item.id === privilege.id))
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

      <UPageCard variant="subtle" :ui="{ container: 'p-0 sm:p-0 gap-y-0' }">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[42rem] text-sm">
            <thead class="bg-elevated/50 text-muted">
              <tr>
                <th class="px-4 py-3 text-left font-medium">
                  权限
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  引用角色
                </th>
                <th class="px-4 py-3 text-right font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-if="status === 'pending'">
                <td colspan="3" class="px-4 py-10 text-center text-muted">
                  加载权限中...
                </td>
              </tr>
              <tr v-else-if="!filteredPermissions.length">
                <td colspan="3" class="px-4 py-10 text-center text-muted">
                  暂无匹配权限
                </td>
              </tr>
              <tr v-for="permission in filteredPermissions" v-else :key="permission.id || permission.type">
                <td class="px-4 py-3">
                  <p class="font-medium text-highlighted">
                    {{ permission.type }}
                  </p>
                  <p class="mt-1 text-muted">
                    #{{ permission.id }}
                  </p>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1.5">
                    <UBadge
                      v-for="role in referencedRoles(permission)"
                      :key="role.id || role.name"
                      color="primary"
                      variant="subtle"
                    >
                      {{ role.alias || role.name }}
                    </UBadge>
                    <span v-if="!referencedRoles(permission).length" class="text-muted">暂无引用</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-1">
                    <UTooltip text="编辑权限">
                      <UButton
                        icon="i-lucide-pencil"
                        color="neutral"
                        variant="ghost"
                        square
                        @click="openEditPrivilege(permission)"
                      />
                    </UTooltip>
                    <UTooltip text="删除权限">
                      <UButton
                        icon="i-lucide-trash"
                        color="error"
                        variant="ghost"
                        square
                        @click="openDeletePrivilege(permission)"
                      />
                    </UTooltip>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UPageCard>

      <UModal v-model:open="createOpen" title="新增权限" description="调用 POST /privileges 创建权限点。">
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

      <UModal v-model:open="editOpen" title="编辑权限" description="调用 PUT /privileges/:id 更新权限点。">
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
