export default defineEventHandler(async (event) => {
  await assertAdminSession(event)
  return proxyFetch(event)
})
