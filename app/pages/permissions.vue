<script setup lang="ts">
import { permissions, riskMeta } from '~/data/rbac'

const toast = useToast()
const q = ref('')
const resourceFilter = ref('all')

const resources = computed(() => Array.from(new Set(permissions.map(permission => permission.resource))))
const resourceItems = computed(() => [
  { label: '全部资源', value: 'all' },
  ...resources.value.map(resource => ({ label: resource, value: resource }))
])

const filteredPermissions = computed(() => {
  const keyword = q.value.trim().toLowerCase()

  return permissions.filter((permission) => {
    const matchKeyword = !keyword || [
      permission.name,
      permission.code,
      permission.resource,
      permission.action,
      permission.description
    ].some(value => value.toLowerCase().includes(keyword))
    const matchResource = resourceFilter.value === 'all' || permission.resource === resourceFilter.value

    return matchKeyword && matchResource
  })
})

function showAction(action: string, name: string) {
  toast.add({
    title: action,
    description: `${name} 的权限操作已记录为静态演示。`
  })
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
          <UButton label="新增权限" icon="i-lucide-key-round" @click="showAction('新增权限', '权限清单')" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="搜索权限名称、编码、资源或动作"
          class="w-full sm:max-w-sm"
        />

        <USelect
          v-model="resourceFilter"
          :items="resourceItems"
          class="w-full sm:w-36"
          :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        />
      </div>

      <UPageCard variant="subtle" :ui="{ container: 'p-0 sm:p-0 gap-y-0' }">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[48rem] text-sm">
            <thead class="bg-elevated/50 text-muted">
              <tr>
                <th class="px-4 py-3 text-left font-medium">
                  权限
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  编码
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  资源
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  动作
                </th>
                <th class="px-4 py-3 text-left font-medium">
                  风险
                </th>
                <th class="px-4 py-3 text-right font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="permission in filteredPermissions" :key="permission.id">
                <td class="px-4 py-3">
                  <p class="font-medium text-highlighted">
                    {{ permission.name }}
                  </p>
                  <p class="mt-1 text-muted">
                    {{ permission.description }}
                  </p>
                </td>
                <td class="px-4 py-3">
                  <UKbd>{{ permission.code }}</UKbd>
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ permission.resource }}
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ permission.action }}
                </td>
                <td class="px-4 py-3">
                  <UBadge :color="riskMeta[permission.risk].color" variant="subtle">
                    {{ riskMeta[permission.risk].label }}
                  </UBadge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-1">
                    <UTooltip text="编辑权限">
                      <UButton
                        icon="i-lucide-pencil"
                        color="neutral"
                        variant="ghost"
                        square
                        @click="showAction('编辑权限', permission.name)"
                      />
                    </UTooltip>
                    <UTooltip text="查看引用角色">
                      <UButton
                        icon="i-lucide-list-tree"
                        color="neutral"
                        variant="ghost"
                        square
                        @click="showAction('查看引用角色', permission.name)"
                      />
                    </UTooltip>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
