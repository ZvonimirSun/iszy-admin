<script setup lang="ts">
import { zh_cn } from '@nuxt/ui/locale'

const colorMode = useColorMode()
const route = useRoute()
const { url, title, description, image, favicon } = usePublicConfig()

const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')
const pageTitle = computed(() => title || '后台管理')
const pageDescription = computed(() => description || pageTitle.value)
const fullPath = computed(() => `${url}${route.path}`)
const ogImage = computed(() => image ? `${url}${image}` : undefined)
const links = computed(() => {
  const result: Array<{ rel: string, href: string, type?: string, sizes?: string, color?: string }> = [
    { rel: 'canonical', href: fullPath.value },
  ]

  if (favicon.small) {
    result.push({ rel: 'icon', type: 'image/png', sizes: '32x32', href: favicon.small })
  }
  if (favicon.medium) {
    result.push({ rel: 'icon', type: 'image/png', sizes: '16x16', href: favicon.medium })
  }
  if (favicon.appleTouchIcon) {
    result.push({ rel: 'apple-touch-icon', sizes: '180x180', href: favicon.appleTouchIcon })
  }
  if (favicon.safariPinnedTab) {
    result.push({ rel: 'mask-icon', href: favicon.safariPinnedTab, color: color.value })
  }
  if (favicon.androidManifest) {
    result.push({ rel: 'manifest', href: favicon.androidManifest })
  }

  return result
})

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: links,
  htmlAttrs: {
    lang: zh_cn.code,
    dir: zh_cn.dir,
  },
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogUrl: fullPath,
  ogImage,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <UApp :locale="zh_cn">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
