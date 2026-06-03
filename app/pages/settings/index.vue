<script setup lang="ts">
const config = usePublicConfig()

const siteItems = computed(() => [{
  label: '站点名称',
  value: config.title || '未配置',
}, {
  label: '站点描述',
  value: config.description || '未配置',
}, {
  label: '站点地址',
  value: config.url || '未配置',
}, {
  label: '后端接口源',
  value: config.apiOrigin || '未配置',
}, {
  label: '开放注册',
  value: config.features?.publicRegister ? '已开启' : '已关闭',
}])

const assetItems = computed(() => [{
  label: 'Logo',
  value: config.logo || '未配置',
}, {
  label: '默认分享图',
  value: config.image || '未配置',
}, {
  label: '小尺寸 Favicon',
  value: config.favicon?.small || '未配置',
}, {
  label: 'Apple Touch Icon',
  value: config.favicon?.appleTouchIcon || '未配置',
}, {
  label: 'Android Manifest',
  value: config.favicon?.androidManifest || '未配置',
}])
</script>

<template>
  <UPageCard
    title="运行配置"
    description="当前后台只展示站点配置状态，配置修改请通过 Nuxt runtimeConfig 或部署环境变量完成。"
    variant="naked"
  />

  <UAlert
    title="仅管理员可访问"
    description="系统设置属于后台管理范围，登录校验会拒绝非管理员账号进入。"
    icon="i-lucide-shield-check"
    color="primary"
    variant="subtle"
  />

  <UPageCard
    title="站点配置"
    description="来自 runtimeConfig.public 的基础站点信息。"
    variant="subtle"
    :ui="{ container: 'divide-y divide-default gap-y-0' }"
  >
    <div
      v-for="item in siteItems"
      :key="item.label"
      class="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <span class="text-sm text-muted">{{ item.label }}</span>
      <span class="break-all text-sm font-medium text-highlighted sm:text-right">{{ item.value }}</span>
    </div>
  </UPageCard>

  <UPageCard
    title="静态资源配置"
    description="用于品牌展示、站点图标与分享预览的公开配置。"
    variant="subtle"
    :ui="{ container: 'divide-y divide-default gap-y-0' }"
  >
    <div
      v-for="item in assetItems"
      :key="item.label"
      class="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <span class="text-sm text-muted">{{ item.label }}</span>
      <span class="break-all text-sm font-medium text-highlighted sm:text-right">{{ item.value }}</span>
    </div>
  </UPageCard>
</template>
