<script setup lang="ts">
import { getPermissionName, permissions, roles } from '~/data/rbac'

const toast = useToast()
const q = ref('')
const createOpen = ref(false)

const newRole = reactive({
  name: '',
  code: '',
  description: '',
  permissionIds: ['perm-user-read', 'perm-role-read']
})

const filteredRoles = computed(() => {
  const keyword = q.value.trim().toLowerCase()

  if (!keyword) return roles

  return roles.filter(role => [role.name, role.code, role.description]
    .some(value => value.toLowerCase().includes(keyword)))
})

function submitCreateRole() {
  toast.add({
    title: '角色已创建',
    description: `${newRole.name || '新角色'} 已绑定 ${newRole.permissionIds.length} 项权限。`,
    color: 'success'
  })
  createOpen.value = false
}

function toggleNewRolePermission(permissionId: string, checked: boolean | 'indeterminate') {
  if (checked && !newRole.permissionIds.includes(permissionId)) {
    newRole.permissionIds.push(permissionId)
    return
  }

  if (!checked) {
    newRole.permissionIds = newRole.permissionIds.filter(id => id !== permissionId)
  }
}

function showAction(action: string, name: string) {
  toast.add({
    title: action,
    description: `${name} 的角色操作已进入静态演示流程。`
  })
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
          <UModal v-model:open="createOpen" title="新增角色" description="配置角色基础信息，并选择可授权的权限点。">
            <UButton label="新增角色" icon="i-lucide-shield-plus" />

            <template #body>
              <UForm :state="newRole" class="space-y-4" @submit="submitCreateRole">
                <UFormField label="角色名称" name="name">
                  <UInput v-model="newRole.name" placeholder="例如：运营管理员" class="w-full" />
                </UFormField>
                <UFormField label="角色编码" name="code">
                  <UInput v-model="newRole.code" placeholder="例如：ops_admin" class="w-full" />
                </UFormField>
                <UFormField label="角色说明" name="description">
                  <UTextarea v-model="newRole.description" placeholder="描述该角色的职责边界" class="w-full" />
                </UFormField>
                <UFormField label="绑定权限" name="permissionIds">
                  <div class="grid gap-2 sm:grid-cols-2">
                    <label
                      v-for="permission in permissions"
                      :key="permission.id"
                      class="flex cursor-pointer items-start gap-2 rounded-md border border-default p-3"
                    >
                      <UCheckbox
                        :model-value="newRole.permissionIds.includes(permission.id)"
                        @update:model-value="toggleNewRolePermission(permission.id, $event)"
                      />
                      <span class="min-w-0">
                        <span class="block text-sm font-medium text-highlighted">{{ permission.name }}</span>
                        <span class="block truncate text-xs text-muted">{{ permission.code }}</span>
                      </span>
                    </label>
                  </div>
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
      <UInput
        v-model="q"
        icon="i-lucide-search"
        placeholder="搜索角色名称、编码或说明"
        class="w-full sm:max-w-sm"
      />

      <div class="grid gap-4 xl:grid-cols-3">
        <UPageCard
          v-for="role in filteredRoles"
          :key="role.id"
          :title="role.name"
          :description="role.description"
          variant="subtle"
          :ui="{ footer: 'border-t border-default pt-4' }"
        >
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <UBadge color="neutral" variant="subtle">
                {{ role.code }}
              </UBadge>
              <UBadge color="primary" variant="subtle">
                {{ role.userCount }} 名用户
              </UBadge>
              <UBadge color="success" variant="subtle">
                {{ role.permissionIds.length }} 项权限
              </UBadge>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="permissionId in role.permissionIds.slice(0, 5)"
                :key="permissionId"
                color="neutral"
                variant="outline"
              >
                {{ getPermissionName(permissionId) }}
              </UBadge>
              <UBadge v-if="role.permissionIds.length > 5" color="neutral" variant="outline">
                +{{ role.permissionIds.length - 5 }}
              </UBadge>
            </div>

            <p class="text-sm text-muted">
              最近更新：{{ role.updatedAt }}
            </p>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                label="编辑"
                icon="i-lucide-pencil"
                color="neutral"
                variant="subtle"
                @click="showAction('编辑角色', role.name)"
              />
              <UButton label="授权" icon="i-lucide-key-round" @click="showAction('角色授权', role.name)" />
            </div>
          </template>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
