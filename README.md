# 拼车购物 Carpool Shopping

大多伦多（GTA）的邻里拼车社交软件：住得近的邻居一起去 Costco、T&T、IKEA，油费按路段 AA，车主只分摊真实成本，不赚钱。

- 设计稿：[`docs/DESIGN.md`](docs/DESIGN.md)（数据库表、权限、页面路由、业务规则）
- 技术栈：Next.js（App Router，静态导出）+ TypeScript + Tailwind + Supabase；以后用 Capacitor 打包成 iOS / 安卓 APP

## 本地运行

需要：**Node.js 22** 和 **Docker Desktop**（本地 Supabase 跑在 Docker 里，先把 Docker Desktop 打开）。

```bash
npm install
npm run db:start     # 启动本地 Supabase。第一次要下载镜像，需要几分钟
npm run env:local    # 把本地 Supabase 的地址和 key 写进 .env.local
npm run dev          # 打开 http://localhost:3000
```

用测试号码登录，验证码都是 **123456**，不会真的发短信：

| 号码 | 是谁 |
|---|---|
| 416 555 0101 | Lily，车主（完整认证），北约克中心，有车 |
| 416 555 0102 | Wei，车主（邻居级），万锦 Unionville，有车 |
| 416 555 0103 | Amy，乘客，北约克中心 |
| 416 555 0104 | Ben，乘客，北约克中心 |
| 416 555 0105 | Chen，乘客，多伦多大学（学校邮箱） |
| 416 555 0106 | Dana，乘客，万锦 Unionville |
| 416 555 0107 | Admin，管理员 |
| 416 555 0110 / 0111 / 0112 | 新用户，用来试注册引导 |

本地还有两个网页工具：

- 数据库管理界面（Supabase Studio）：http://127.0.0.1:54323
- 邮件收件箱（Mailpit）：http://127.0.0.1:54324 ——用学校邮箱加入社区时，验证码邮件在这里看

其他常用命令：`npm run db:reset`（把数据库恢复成种子数据）、`npm run db:stop`（停止本地 Supabase）。

## 测试

```bash
npm test             # 单元测试：油费分摊、最大余数法、集合点路线、手机号格式
npm run db:test      # 数据库测试（pgTAP）：权限规则、加入社区、删除账号
npm run e2e          # 浏览器端到端测试：登录、注册引导、加入社区、切换语言、删除账号
npm run typecheck    # TypeScript 类型检查
npm run lint         # 代码检查
npm run build        # 静态导出到 out/
npm run preview      # 用静态服务器打开 out/：http://localhost:3000
```

- `db:test` 和 `e2e` 需要本地 Supabase 在运行（`npm run db:start`）。
- 第一次跑 `e2e` 前先装浏览器：`npx playwright install chromium`。
- `e2e` 会自动启动 `npm run dev`；测试里用到的新用户（0110–0112）会在测试前后自动删除，可以重复跑。
- `npm run preview` 跑的是正式构建，会注册 service worker（推送通知、离线页）；`npm run dev` 不注册。

## 目录

```
src/app/              页面（全部是客户端页面，可以静态导出）
  (tabs)/             底部 5 个 Tab：首页、找车、小区、消息、我的（需要登录）
  welcome/            介绍页
  login/、login/verify/  手机号登录、输入验证码
  onboarding/         注册引导：昵称 → 主要身份 → 加入小区或学校
  me/verify/          认证与社区
  fare/               油费怎么算（公式说明 + 可改数字的计算器）
src/i18n/             中文 zh.ts（标准）/ 英文 en.ts，所有界面文案都在这里
src/lib/fare/         油费分摊纯函数和单元测试
src/lib/auth/         登录状态、用户资料、语言和身份同步
src/lib/supabase/     Supabase 客户端和自动生成的数据库类型（npm run db:types）
src/lib/platform/     网页和 APP 的平台差异（推送、定位等），打包时在这里加原生实现
supabase/migrations/  数据库结构、权限规则、数据库函数
supabase/tests/       数据库测试
supabase/seed.sql     本地种子数据（社区、门店、集合点、测试账号、车辆）
e2e/                  浏览器端到端测试
public/sw.js          service worker
```

## 开发进度

- [x] M0 脚手架、中英文、PWA 外壳、油费分摊纯函数和单元测试
- [x] M1 本地 Supabase、种子数据、手机号登录、注册引导、加入社区（住址 / 学校邮箱）、删除账号
- [ ] M2 车辆档案和照片、官方集合点
- [ ] M3 发班次（单次 / 重复）、算路线、定时任务
- [ ] M4 找车、报名、提议集合点、审批、关注、推送
- [ ] M5 上车 PIN、缺席、信用分
- [ ] M6 油费实时预估、结算、标记已付
- [ ] M7 群聊、拼单分装、小区主页、闲置帖子
- [ ] M8 评价、整洁度、徽章
- [ ] M9 优惠券和积分
- [ ] M10 管理后台、举报、隐私政策
- [ ] M11 PWA 打磨、Capacitor 打包说明

## 说明

- 地址联想现在用示例数据（几个大多伦多路口），M3 接入 Google 地图后换成真实地址。
- 本地登录只认测试号码；正式环境在 Supabase 控制台里配置短信服务商（如 Twilio）。
- `prototype/index.html` 是早期的单文件可点击原型（演示数据），和正式代码无关，保留作参考。
