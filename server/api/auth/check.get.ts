import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { PublicSimpleUser } from '#shared/types/auth'

export default defineEventHandler(async (event): Promise<ResultDto<{
  logged: boolean
  profile?: PublicSimpleUser
}>> => {
  const session = await getRedisSession(event)
  if (!session) {
    return {
      success: true,
      data: {
        logged: false,
      },
      message: '未登录',
    }
  }

  try {
    const profile = await assertAdminSession(event)
    return {
      success: true,
      data: {
        logged: true,
        profile: toPublicSimpleUser(profile),
      },
      message: '已登录',
    }
  }
  catch (error) {
    if ((error as { statusCode?: number }).statusCode === 403) {
      throw error
    }
    // fall through to the unauthenticated response below
  }

  return {
    success: true,
    data: {
      logged: false,
    },
    message: '未登录',
  }
})
