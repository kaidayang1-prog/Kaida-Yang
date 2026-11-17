# 拼车购物 Carpool Shopping

大多伦多（GTA）的邻里拼车社交软件：住得近的邻居一起去 Costco、T&T、IKEA，油费按路段 AA，车主只分摊真实成本，不赚钱。

- 设计稿：[`docs/DESIGN.md`](docs/DESIGN.md)（数据库表、权限、页面路由、业务规则）
- 技术栈：Next.js（App Router，静态导出）+ TypeScript + Tailwind + Supabase；以后用 Capacitor 打包成 iOS / 安卓 APP

## 本地运行

需要 Node.js 22（LTS）。

```bash
npm install
npm run dev          # 开发模式：http://localhost:3000
```

打开后会先到介绍页（`/welcome`），点“开始使用”进入主界面。右上角或“我的”里可以切换中文 / English，首页可以切换“我是乘客 / 我是车主”。

## 测试

```bash
npm test             # 单元测试（油费分摊、最大余数法、集合点路线）
npm run typecheck    # TypeScript 类型检查
npm run lint         # 代码检查
npm run build        # 静态导出到 out/
npm run preview      # 用静态服务器打开 out/：http://localhost:3000
```

`npm run preview` 跑的是正式构建，会注册 service worker（推送通知、离线页）；`npm run dev` 不注册。
在 Chrome 里打开 `npm run preview` 的地址，开发者工具 → Application → Manifest 可以检查“加到主屏幕”的配置。

## 目录

```
src/app/             页面（全部是客户端页面，可以静态导出）
  (tabs)/            底部 5 个 Tab：首页、找车、小区、消息、我的
  welcome/           介绍页
  fare/              油费怎么算（公式说明 + 可改数字的计算器）
  offline/           离线页
  manifest.ts        PWA manifest
src/i18n/            中文 zh.ts（标准）/ 英文 en.ts，所有界面文案都在这里
src/lib/fare/        油费分摊纯函数和单元测试
src/lib/platform/    网页和 APP 的平台差异（推送、定位等），打包时在这里加原生实现
src/components/      界面组件
public/sw.js         service worker
public/icons/        PWA 图标（scripts/generate-icons.mjs 生成）
supabase/            数据库迁移和权限测试（M1 起接入）
```

## 开发进度

- [x] M0 脚手架、中英文、PWA 外壳、油费分摊纯函数和单元测试
- [ ] M1 本地 Supabase、种子数据、手机号登录、引导、加入社区
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

## 关于 `prototype/`

`prototype/index.html` 是早期的单文件可点击原型（演示数据），和正式代码无关，保留作参考。
