import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import type { H3Event } from 'h3'
import { RoleEnum } from '@zvonimirsun/iszy-common'

const ADMIN_ROLES = new Set<string>([RoleEnum.ADMIN, RoleEnum.SUPERADMIN])

export function hasAdminRole(user?: Pick<PublicUser, 'roles'> | null) {
  return user?.roles?.some(role => ADMIN_ROLES.has(role.name)) ?? false
}

export function assertAdminUser(user?: Pick<PublicUser, 'roles'> | null) {
  if (!hasAdminRole(user)) {
    throw createError({
      statusCode: 403,
      statusMessage: '权限不足',
      message: '仅管理员可以访问后台',
    })
  }
}

export async function assertAdminSession(event: H3Event) {
  const res = await authFetch<ResultDto<PublicUser>>(event, '/user/me')
  if (!res.success || !res.data) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登录',
      message: '未登录',
    })
  }
  assertAdminUser(res.data)
  return res.data
}
