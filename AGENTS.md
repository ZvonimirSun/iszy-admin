# 项目目标与协作约定

## 项目定位

- 当前项目基于 Nuxt Dashboard Template 创建，目标是演进为一个后端管理软件。
- 当前阶段先完成 RBAC 管理界面的产品骨架与前端交互，后续接口接入要对齐现有 ISZY 项目体系。
- 页面、组件和交互应尽量沿用模板已有的 Nuxt UI / Dashboard 结构和视觉风格，避免引入与模板不一致的复杂设计。

## 当前功能范围

- 用户管理：展示用户列表、用户状态、所属角色、基础筛选/搜索、创建/编辑/禁用等静态交互入口。
- 角色管理：展示角色列表、角色说明、成员数量、绑定权限、创建/编辑/删除等静态交互入口。
- 权限管理：展示权限资源、权限动作、权限编码、分组筛选，以及后续可被角色授权使用的权限清单。

## 接口与认证参考

- 后端接口接入方式参考 `zvonimirsun/iszy-tools-next`，本地源码路径为 `E:\codes\iszy-tools-next`。
- 实际接口与模型结构参考 `zvonimirsun/iszy-api`，本地源码路径为 `E:\codes\iszy-api`。
- 优先使用 DeepWiki MCP 查询上述两个仓库的当前结构；如果 DeepWiki 未索引或不可用，则直接读取本机相邻源码作为依据。
- 登录、登出、会话维护逻辑应直接复用 `iszy-tools-next` 的实现思路：
  - Nuxt server 侧通过 `/api/auth/login`、`/api/auth/logout`、`/api/auth/check` 承接前端请求。
  - 登录成功后只在服务端保存后端返回的 `access_token` / `refresh_token`，客户端通过 httpOnly session cookie 维持登录态。
  - 服务端请求后端 API 时使用 `authFetch` / `proxyFetch` 思路注入 Bearer token，并在 401 时用 refresh token 刷新。
  - session 轮换沿用 Redis session + tombstone 模式，避免在客户端暴露 token。
  - 参考文件：`server/api/auth/login.post.ts`、`server/api/auth/logout.post.ts`、`server/api/auth/check.get.ts`、`server/utils/authFetch.ts`、`server/utils/sessionStore.ts`、`server/middleware/session.ts`、`app/stores/user.ts`、`app/pages/login.vue`、`app/pages/logout.vue`。
- `iszy-api` 当前认证接口和用户接口参考：
  - `POST /auth/login`、`POST /auth/logout`、`POST /auth/refresh`、`GET /auth/devices`，见 `src/domains/auth/auth.controller.ts`。
  - `GET /user/list`、`POST /user`、`GET /user/:id`、`PUT /user/:id`、`DELETE /user/:id`、`PUT /user/activate`、`PUT /user/ban`、`GET /user/search`，见 `src/domains/user/user.controller.ts`。
  - `GET /user/me`、`PUT /user/me`，见 `src/domains/user/me.controller.ts`。
- `iszy-api` 当前 RBAC 模型参考：
  - 用户模型：`src/domains/user/entities/user.model.ts`，核心字段包括 `userId`、`userName`、`nickName`、`mobile`、`email`、`status`、`roles`、`groups`、`privileges`。
  - 角色模型：`src/domains/user/entities/role.model.ts`，核心字段包括 `id`、`name`、`alias`、`desc`、`users`、`groups`、`privileges`。
  - 权限模型：`src/domains/user/entities/privilege.model.ts`，核心字段包括 `id`、`type`。
  - 用户角色关联：`src/domains/user/entities/user-role.model.ts`；角色权限关联：`src/domains/user/entities/role-privilege.model.ts`。
  - 共享类型参考 `E:\codes\iszy-common\src\types\user` 与 `E:\codes\iszy-common\src\enums\userstatus.enum.ts`。
- 前端接入接口时，业务 DTO / enum / model 类型优先从 `@zvonimirsun/iszy-common` 导入，例如 `ResultDto`、`PublicUser`、`RegisterUser`、`UpdateUser`、`RawRole`、`RawPrivilege`、`UserStatus`；只为 Nuxt session、页面视图状态等本项目私有概念定义本地类型。

## 实现原则

- 接口接入前可以使用本地静态数据或页面内 mock 数据，但类型命名和字段结构应尽量向 `iszy-api` / `iszy-common` 对齐。
- 交互可以先通过本地状态、Toast、Modal、Slideover 等方式表达完整管理流程。
- 命名和文案优先使用中文，贴近后台管理系统语境。
- 保持实现简单清晰，除非已有模板模式要求，否则不要提前抽象复杂权限模型或请求层。
- 修改时优先保持小步、聚焦，不做无关重构。
- 除非用户明确要求，不主动进行浏览器页面实际检查；优先使用类型检查、lint 和源码层验证。
