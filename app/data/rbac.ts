import type { RawPrivilege, RawRole } from '@zvonimirsun/iszy-common'

export type AdminUserStatus = 'active' | 'disabled' | 'pending'
export type PermissionRisk = 'low' | 'medium' | 'high'

export interface AdminPermission extends Omit<RawPrivilege, 'id'> {
  id: string
  name: string
  code: string
  resource: string
  action: string
  description: string
  risk: PermissionRisk
}

export interface AdminRole extends Omit<RawRole, 'id' | 'privileges'> {
  id: string
  name: string
  code: string
  description: string
  userCount: number
  permissionIds: string[]
  updatedAt: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  department: string
  status: AdminUserStatus
  roleIds: string[]
  lastLoginAt: string
}

export const permissions: AdminPermission[] = [
  {
    id: 'perm-user-read',
    name: '查看用户',
    code: 'user:read',
    type: 'user:read',
    resource: '用户',
    action: '查看',
    description: '查看用户列表、用户详情与基础资料',
    risk: 'low',
  },
  {
    id: 'perm-user-write',
    name: '维护用户',
    code: 'user:write',
    type: 'user:write',
    resource: '用户',
    action: '编辑',
    description: '创建用户、编辑资料、调整状态',
    risk: 'medium',
  },
  {
    id: 'perm-role-read',
    name: '查看角色',
    code: 'role:read',
    type: 'role:read',
    resource: '角色',
    action: '查看',
    description: '查看角色列表、角色详情与成员数量',
    risk: 'low',
  },
  {
    id: 'perm-role-write',
    name: '维护角色',
    code: 'role:write',
    type: 'role:write',
    resource: '角色',
    action: '编辑',
    description: '创建角色、编辑角色说明、调整绑定权限',
    risk: 'high',
  },
  {
    id: 'perm-permission-read',
    name: '查看权限',
    code: 'permission:read',
    type: 'permission:read',
    resource: '权限',
    action: '查看',
    description: '查看权限清单、权限编码和资源动作',
    risk: 'low',
  },
  {
    id: 'perm-permission-write',
    name: '维护权限',
    code: 'permission:write',
    type: 'permission:write',
    resource: '权限',
    action: '编辑',
    description: '新增权限点、调整权限说明和风险等级',
    risk: 'high',
  },
  {
    id: 'perm-audit-read',
    name: '查看审计',
    code: 'audit:read',
    type: 'audit:read',
    resource: '审计',
    action: '查看',
    description: '查看后台操作日志与权限变更记录',
    risk: 'medium',
  },
]

export const roles: AdminRole[] = [
  {
    id: 'role-super-admin',
    name: '超级管理员',
    alias: '超级管理员',
    code: 'super_admin',
    description: '拥有后台全部管理权限，负责系统配置与高风险操作审批',
    userCount: 2,
    permissionIds: permissions.map(permission => permission.id),
    updatedAt: '2026-05-20 14:30',
  },
  {
    id: 'role-ops-admin',
    name: '运营管理员',
    alias: '运营管理员',
    code: 'ops_admin',
    description: '负责用户日常管理、角色查询和基础运营处理',
    userCount: 8,
    permissionIds: ['perm-user-read', 'perm-user-write', 'perm-role-read', 'perm-permission-read'],
    updatedAt: '2026-05-22 09:18',
  },
  {
    id: 'role-auditor',
    name: '审计员',
    alias: '审计员',
    code: 'auditor',
    description: '只读查看用户、角色、权限和审计日志，不能修改业务数据',
    userCount: 4,
    permissionIds: ['perm-user-read', 'perm-role-read', 'perm-permission-read', 'perm-audit-read'],
    updatedAt: '2026-05-21 17:05',
  },
]

export const users: AdminUser[] = [
  {
    id: 'U-10001',
    name: '林青',
    email: 'lin.qing@example.com',
    department: '平台运营部',
    status: 'active',
    roleIds: ['role-super-admin'],
    lastLoginAt: '2026-05-24 09:12',
  },
  {
    id: 'U-10002',
    name: '周宁',
    email: 'zhou.ning@example.com',
    department: '客户成功部',
    status: 'active',
    roleIds: ['role-ops-admin'],
    lastLoginAt: '2026-05-23 18:44',
  },
  {
    id: 'U-10003',
    name: '陈一凡',
    email: 'chen.yifan@example.com',
    department: '风控合规部',
    status: 'active',
    roleIds: ['role-auditor'],
    lastLoginAt: '2026-05-22 11:20',
  },
  {
    id: 'U-10004',
    name: '王默',
    email: 'wang.mo@example.com',
    department: '平台运营部',
    status: 'pending',
    roleIds: ['role-ops-admin'],
    lastLoginAt: '等待首次登录',
  },
  {
    id: 'U-10005',
    name: '许知夏',
    email: 'xu.zhixia@example.com',
    department: '财务部',
    status: 'disabled',
    roleIds: ['role-auditor'],
    lastLoginAt: '2026-05-08 15:27',
  },
]

export const statusMeta: Record<AdminUserStatus, { label: string, color: 'success' | 'warning' | 'neutral' }> = {
  active: { label: '启用', color: 'success' },
  pending: { label: '待激活', color: 'warning' },
  disabled: { label: '停用', color: 'neutral' },
}

export const riskMeta: Record<PermissionRisk, { label: string, color: 'success' | 'warning' | 'error' }> = {
  low: { label: '低风险', color: 'success' },
  medium: { label: '中风险', color: 'warning' },
  high: { label: '高风险', color: 'error' },
}

export function getRoleName(roleId: string) {
  return roles.find(role => role.id === roleId)?.name ?? roleId
}

export function getPermissionName(permissionId: string) {
  return permissions.find(permission => permission.id === permissionId)?.name ?? permissionId
}
