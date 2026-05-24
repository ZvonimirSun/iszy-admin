// @ts-check
import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(antfu({
  rules: {
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 3 }],
  },
}))
