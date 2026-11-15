# 拼车购物 Carpool Shopping — MVP 设计稿（待确认）

> 状态：草案 v0.1，确认后才开始写代码。
> 技术栈：Next.js 15（App Router）+ TypeScript + Tailwind + Supabase（Postgres / Auth / Storage）+ Google Maps（Places、Directions）。

---

## 0. 几个基础决定

| 项 | 决定 |
|---|---|
| 金额 | 全部用 **整数分（cents）** 存储，类型 `integer`，避免浮点误差。 |
| 距离 | `numeric(7,2)` 公里。 |
| 时区 | 存 `timestamptz`，界面按 `America/Toronto` 显示。 |
| 权限 | 全表开 RLS；写操作走 Next.js Server Actions + Postgres 函数（`security definer`），关键规则在数据库里再校验一次。 |
| 手机验证码 | 用 Supabase 本地 `auth.sms.test_otp`：种子手机号固定验证码 `123456`，不接真实短信。 |
| 身份认证 / 背景调查 | 占位流程：上传材料（可随便传张图）→ `pending` → 管理员后台手动通过/拒绝。 |
| 地图 | 有 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_SERVER_KEY` 时用真实 Places + Directions；**没有 key 时自动退回模拟**（直线距离 × 1.3 + 预置 GTA 地址联想），保证种子流程不依赖 key。 |
| 定时任务 | Postgres 函数 `run_scheduler()`：截止未成团自动取消、生成每周重复班次。本地用 `pg_cron` 每分钟跑一次，同时提供 `/api/cron` 和开发页上的“手动触发”按钮方便测试。 |
| 多语言 | 中/英字典 + cookie 记住语言，不把语言放进 URL。 |
| 设计 | 手机优先（最大宽度 480px 居中），底部 Tab 栏，强调色只用一种：**teal-600 `#0D9488`**，其余为灰阶。 |

---

## 1. 数据库表设计

### 1.1 用户与社区

**profiles**（1:1 对应 `auth.users`）
| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid PK → auth.users | |
| phone | text unique | E.164，例如 +14165550101 |
| display_name | text | |
| avatar_path | text null | Storage 路径 |
| locale | text `zh` / `en` | 默认 `zh` |
| is_driver | bool | 乘客默认都有；开通车主后为 true |
| driver_tier | enum `none` / `neighbor` / `full` | |
| home_address, home_lat, home_lng | | 邻居级车主需填地址或学校邮箱 |
| school_email | text null | |
| school_email_verified_at | timestamptz null | 模拟：点链接即验证 |
| status | enum `active` / `suspended` | 管理员可暂停 |
| is_admin | bool | |
| created_at | timestamptz | |

**communities** — 楼 / 小区 / 学校
| 列 | 说明 |
|---|---|
| id, name_zh, name_en | |
| kind | enum `building` / `complex` / `school` |
| address, lat, lng | 学校可为空 |
| email_domain | 学校用，如 `utoronto.ca` |

**community_members**：`(profile_id, community_id)` PK，`verified_via` enum `address` / `school_email` / `admin`，`created_at`。
→ 邻居级车主的班次只对和他有**共同社区**的人可见。

**driver_verifications**：id, profile_id, tier_requested (`neighbor`/`full`), status (`pending`/`approved`/`rejected`), id_document_path（模拟）, background_check (`mock_pending`/`mock_clear`), reviewed_by, reviewed_at, note。

### 1.2 车辆

**vehicles**
| 列 | 约束 |
|---|---|
| id, driver_id | 一个车主 MVP 期一辆默认车，表结构允许多辆 |
| make_model, color, plate | |
| seats | `check (seats between 2 and 7)`（含司机的总座位） |
| trunk_size | enum `small` / `medium` / `large` |
| fuel_l_per_100km | numeric(4,1) `check (between 3 and 25)` |
| pets_on_board, smoking | bool |
| photos_updated_at | timestamptz，上传新照片时触发器更新 → 卡片“照片更新于 X 天前” |
| is_active | bool |

**vehicle_photos**：id, vehicle_id, kind (`seat`/`trunk`), storage_path, created_at。
规则：发班次前校验该车 seat ≥ 1 且 trunk ≥ 1。

### 1.3 目的地、班次

**destinations**：id, brand (`costco`/`tnt`/`ikea`/`other`), name, address, lat, lng。种子：GTA 各门店（如 Costco North York、T&T Promenade、IKEA North York 等）。

**trip_series**（每周重复模板）
| 列 | 说明 |
|---|---|
| id, driver_id, vehicle_id, destination_id | |
| weekday | 0–6 |
| window_start, window_end | `time`，如 10:00–12:00 |
| seats_offered | ≤ vehicle.seats − 1 |
| deadline_hours_before | 截止时间 = 开始前 N 小时（默认 12） |
| min_riders | 默认 2 |
| visibility | `public` / `community` |
| start_date, end_date null, is_active | |

**trip_series_skips**：`(series_id, skip_date)` PK — 跳过某一期。

**trips**（每一期具体班次）
| 列 | 说明 |
|---|---|
| id, series_id null, driver_id, vehicle_id, destination_id | |
| trip_date, window_start, window_end | |
| seats_offered | |
| signup_deadline | timestamptz |
| min_riders | 默认 2（说明：按“已接受乘客数”计，不含车主——见待确认问题 Q2） |
| visibility | `public` / `community`；邻居级车主强制 `community` |
| gas_price_cents_per_l | integer `check (between 50 and 350)` |
| status | `open` → `confirmed`（截止时成团）/ `cancelled` → `in_progress` → `completed` |
| cancel_reason | `not_enough_riders` / `driver_cancelled` / `admin` |
| route_locked_at | 行程结束时锁定 |
| share_token | 随机字符串，分享链接 `/s/{token}` |

RLS 可见性：`visibility='public'` 且车主未被暂停、未被整洁度暂停；或 viewer 与车主有共同社区。

### 1.4 报名与路线

**bookings**
| 列 | 说明 |
|---|---|
| id, trip_id, passenger_id | unique(trip_id, passenger_id) |
| status | `pending` / `accepted` / `rejected` / `withdrawn` / `boarded` / `no_show` |
| pickup_address, pickup_lat, pickup_lng | 地址联想 |
| dropoff_address, dropoff_lat, dropoff_lng | 默认与上车点相同 |
| pin | char(4)，接受时生成，只有本人可读 |
| boarded_at | 车主输入正确 PIN 后写入 |

接受报名用函数 `accept_booking(booking_id)`：`select … for update` 锁 trip，已接受数 ≥ seats_offered 时报错——座位满了不能再接受。

**route_stops**
| 列 | 说明 |
|---|---|
| id, trip_id, seq | unique(trip_id, seq) |
| kind | `origin`（车主家）/ `pickup` / `destination` / `dropoff` / `return`（回车主家） |
| booking_id null | pickup/dropoff 对应哪个乘客 |
| label, lat, lng | |

**route_legs**
| 列 | 说明 |
|---|---|
| id, trip_id, seq | 第 seq 段 = stop[seq] → stop[seq+1] |
| distance_km | Directions API 算出（或模拟） |
| is_manual | 车主手动改过公里数 → 界面标“手动” |
| source | `google` / `mock` / `manual` |

接受乘客或车主调整顺序后：重建 stops → 重算未手动的 legs。
每段车上有谁不单独存，由 stops 顺序**推导**（车主 + 已上车点、未下车点的乘客），交给纯函数计算。

### 1.5 关注、通知、群聊

**follows**：`(follower_id, driver_id)` PK。车主发新班次（或系列生成新一期）时给关注者写通知（社区可见的班次只通知能看见的人）。

**notifications**：id, user_id, type（`trip_new` / `booking_accepted` / `booking_rejected` / `trip_cancelled_min_riders` / `errand_claimed` / `bill_ready` / `payment_marked` / `payment_confirmed` / `dispute_update` / `photo_refresh_needed` …）, payload jsonb, read_at。站内通知 + 模拟短信（写进 `sms_outbox` 表，开发页可查看）。

**trip_messages**：id, trip_id, sender_id, body, phrase_key null（快捷短语，如“我到楼下了”“堵车晚 5 分钟”“请在 B 门”），created_at。用 Supabase Realtime 推送。

### 1.6 代买

**errand_requests**
| 列 | 说明 |
|---|---|
| id, trip_id, requester_id | requester 不能是该行程已上车的人 |
| handoff_location | 交接地点 |
| budget_cap_cents | 整单预算上限 |
| status | `open` / `claimed` / `purchased` / `handed_off` / `cancelled` |
| claimed_by | 车上的人（车主或已接受乘客） |
| receipt_total_cents | 按小票录入 |
| receipt_photo_path | 可选 |

**errand_items**：id, request_id, name, quantity, note, is_checked（边买边勾选）。
超出预算 → 录入时前端和函数都提示（允许保存，但标红并通知发单人）。只报销小票金额，没有跑腿费字段。

### 1.7 账单与结算

**bills**：id, trip_id unique, total_fuel_cents, generated_at（行程结束、锁定路线时生成）。

**bill_lines**（每条 = 谁付给谁多少钱）
| 列 | 说明 |
|---|---|
| id, bill_id | |
| payer_id, payee_id | |
| kind | `fuel` / `errand` / `dispute` |
| ref_id | errand_request_id / dispute_id |
| amount_cents | |
| status | `unpaid` → `marked_paid`（付款方点“我已付款”）→ `confirmed`（收款方点“确认收款”） |
| marked_paid_at, confirmed_at | |

**bill_fuel_shares**：bill_id, person_id, share_cents, breakdown jsonb（逐段明细快照，锁定后不再变）。车主自己的份额只展示、不生成 bill_line。
平台不经手资金，只记录状态，付款提示里显示收款人的 Interac 邮箱/手机号。

### 1.8 评分

**ratings**：id, trip_id, rater_id, ratee_id, stars 1–5, tags text[]，unique(trip_id, rater_id, ratee_id)。双向：乘客评车主、车主评乘客。

**vehicle_cleanliness_ratings**：id, trip_id, rater_id, vehicle_id, score 1–5, tags enum[]（`seats_clean` / `no_odor` / `trunk_usable` / `no_pet_hair` / `not_as_pictured`），unique(trip_id, rater_id)。

**视图 `user_rating_summary`**：最近 100 次平均分；次数 < 3 时返回 null（界面显示“新用户”）。
**视图 `vehicle_cleanliness_summary`**：最近 20 次平均；次数 < 3 不显示。
**规则**（插入评分后触发器执行）：
- 次数 ≥ 5 且平均 < 3.5 → 通知车主更新照片；
- 次数 ≥ 5 且平均 < 3.0 → `vehicles.public_suspended = true`，其公开班次不再出现在浏览里；车主上传新照片并由管理员恢复后解除。

### 1.9 帮助与申诉、管理

**disputes**
| 列 | 说明 |
|---|---|
| id, trip_id, reporter_id, against_id null | |
| type | `soiled_vehicle` / `vehicle_damage` / `not_as_described` / `lost_item` / `fare_error` / `safety` / `misconduct` |
| description | |
| repair_estimate_cents | `vehicle_damage` 必填 |
| status | `open` / `reviewing` / `resolved` / `rejected` |
| ruling_amount_cents, ruling_payer_id, ruling_payee_id, ruling_note, resolved_by, resolved_at | 裁决金额 → 生成 `dispute` 类型的 bill_line |

**dispute_attachments**：id, dispute_id, storage_path, kind (`photo`/`estimate`)。
校验（函数 `submit_dispute`）：`soiled_vehicle` 至少 1 张照片；`vehicle_damage` 照片 + 估价。

**admin_actions**（审计日志）：id, admin_id, action（`approve_verification` / `reject_verification` / `suspend_user` / `restore_user` / `resolve_dispute` / `restore_vehicle`）, target_id, note, created_at。

### 1.10 Storage 桶
`vehicle-photos`、`receipts`、`dispute-evidence`、`verification-docs`（私有，管理员可读）、`avatars`。

---

## 2. 油费分摊纯函数

文件：`src/lib/fare/splitFare.ts`，零依赖，Vitest 测试。

```ts
type Leg = { km: number; riders: string[] };      // riders 含车主
type Input = { fuelLPer100km: number; gasPricePerL: number; legs: Leg[] };
type Output = {
  costPerKm: number;
  totalCents: number;
  shares: Record<string, number>;                  // 每人应付（分）
  legs: { km: number; costExact: number; riders: string[]; perPersonExact: number }[];
};
```

算法：
1. 校验油耗 3–25、油价 0.50–3.50、km ≥ 0、每段至少 1 人。
2. `costPerKm = 油耗/100 × 油价`；每段成本 = km × costPerKm，由该段 riders 平分，累加得到每人精确值（不取整）。
3. `totalCents = round(Σ段成本 × 100)`。
4. **最大余数法**：每人先取 floor(精确分)，剩下的分数按小数部分从大到小各补 1 分（并列时按 id 排序保证稳定）。合计必然等于 totalCents。

用你给的数据手算验证（车主 = D，乘客 A 坐第 2–5 段，乘客 B 坐第 3–4 段）：
- 每公里 = 0.085 × 1.69 = $0.14365；总油费精确值 $3.7349 → **373 分**
- D 精确 169.75 分，A 120.91 分，B 82.84 分 → floor 合计 371，差 2 分，补给小数最大的 A(.91)、B(.84)
- 结果 **D $1.69 / A $1.21 / B $0.83，合计 $3.73** ✅

---

## 3. 页面结构（App Router）

底部 Tab：**发现** ｜ **我的行程** ｜ **开车** ｜ **消息** ｜ **我**

```
src/app/
├─ (auth)/login                 手机号输入
├─ (auth)/login/verify          验证码
├─ onboarding                   昵称、语言、地址/学校邮箱 → 加入社区
├─ (tabs)/
│  ├─ page.tsx                  发现：班次列表，筛选 目的地 / 日期 / 有空位；关注的车主置顶
│  ├─ trips                     我的行程（乘客 + 车主，按 即将/进行中/已完成）
│  ├─ drive                     车主中心：我的班次、待处理报名、车辆、认证状态
│  ├─ inbox                     通知
│  └─ me                        资料、语言切换、我关注的、我的评分、账单汇总
├─ trips/[id]                   班次详情：车辆卡（照片更新于 X 天前、整洁度）、车主评分、
│                               报名（填上车点）、我的费用预估 + 逐段明细
│  ├─ route                     路线：地图 + 站点列表，车主拖动排序、改公里数（标“手动”）
│  ├─ board                     车主：逐个乘客输入 4 位 PIN 上车；乘客：看自己的 PIN
│  ├─ chat                      群聊 + 快捷短语；顶部 SOS（确认弹窗 → tel:911）、分享链接
│  ├─ errands                   代买清单列表；new 发清单；[errandId] 认领/勾选/录小票
│  ├─ bill                      账单：油费 + 代买 + 申诉裁决，“我已付款” / “确认收款”
│  └─ rate                      评分（星 + 标签；乘客额外给整洁度）
├─ drive/new                    发班次（单次 / 每周重复）
├─ drive/series/[id]            重复班次：查看期数、跳过某一期、停止
├─ drive/vehicle                车辆档案 + 座椅/后备箱照片上传
├─ drive/verify                 车主认证：邻居级（地址/学校邮箱）、完整级（模拟材料上传 → 待审核）
├─ drivers/[id]                 车主主页：评分、车辆、关注按钮、即将发出的班次
├─ help                         帮助中心；help/new 提交申诉（按类型要求证据）；help/[id] 进度
├─ s/[token]                    公开分享页（不登录可看：目的地、时间段、车辆颜色/车型、当前站点，不显示车牌全号与电话）
├─ admin/                       管理员（is_admin 才能进）
│  ├─ verifications             车主认证审核
│  ├─ disputes                  申诉处理 + 裁决金额
│  └─ users                     搜索用户，暂停/恢复账号、恢复被暂停的车辆
├─ dev                          仅开发环境：切换种子用户、手动触发调度、查看模拟短信
└─ api/cron                     调度入口（截止取消、生成重复班次）
```

`src/lib/`：`fare/`（纯函数）、`maps/`（google + mock 适配器）、`i18n/`（zh.ts、en.ts）、`supabase/`（server/client）、`format/`。
`supabase/`：`migrations/`、`seed.sql`、`config.toml`（含 test_otp）。

---

## 4. 种子数据与完整流程

- 社区：「Yonge & Sheppard 某公寓」「Markham 某小区」「U of T St. George」
- 用户（验证码都是 123456）：
  - 车主 Lily（完整级，公开班次，周六 10:00–12:00 Costco 每周重复）
  - 车主 Wei（邻居级，社区班次，T&T）
  - 乘客 Amy、Ben、Chen（与 Wei 同小区）、Dana（不同社区，看不到 Wei 的班次）
  - 管理员 Admin
- 已有：一个已完成的行程（带账单、评分），一个进行中的报名，一个人数不足即将被取消的班次，一条代买清单，一条待处理申诉，一条待审核的完整级认证。

---

## 5. 开发顺序（每完成一块告诉你怎么本地运行和测试）

| # | 模块 | 测试方式 |
|---|---|---|
| M0 | 项目脚手架、Tailwind、i18n、**油费分摊纯函数 + 单测** | `npm test` |
| M1 | Supabase 迁移、种子、手机号登录、角色、社区、车主分级 | 本地 Supabase + 种子账号登录 |
| M2 | 车辆档案 + 照片 | |
| M3 | 发班次、重复/跳过、截止自动取消、可见性 | dev 页手动触发调度 |
| M4 | 浏览筛选、报名、关注、接受/拒绝 | |
| M5 | 路线、地图、逐段费用实时预估 | 无 key 走模拟 |
| M6 | PIN 上车、群聊、分享、SOS | |
| M7 | 代买 | |
| M8 | 账单与结算 | |
| M9 | 评分与整洁度规则 | |
| M10 | 帮助申诉 + 管理后台 | |

本地运行前置：Node 20+、Docker（运行 `supabase start`）、Supabase CLI。
