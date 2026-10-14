// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  app: {
    baseURL: '/pattern-visualiser/',
    head: {
      title: 'Pattern visualiser',
      meta: [
        {
          name: 'description',
          content: 'Preview frame-based LED grid animations for micro:bit we:create projects.',
        },
      ],
    },
  },
})
