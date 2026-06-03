# Plan

## 1. 文档定位

本文件定义 `野性人格局` 怎么做，包括技术选型、目录结构、环境配置、AI 联调方式和当前工程推进策略。

本文件同时承担技术验收对照作用，要求与当前仓库代码状态保持同步。

## 2. 当前实现策略

项目采用 `前端优先，AI 代理后接` 的比赛型路线：

- 第一阶段先完成高完成度前端 MVP，保证现场可演示
- 第二阶段抽离 AI 叙事服务层，支持 `mock / proxy / fallback`
- 第三阶段再接后端代理接口，避免把密钥暴露在前端

这样做的好处：

- 即使没有后端，也能稳定展示产品形态
- 一旦后端准备好，前端只需要切换模式即可联调
- GitHub 上能同时展示“产品完成度”和“工程方法”

## 3. 技术选型

### 3.1 前端栈

- `Vue 3`
- `Vite`
- `TypeScript`
- `Pinia`
- `Vue Router`

### 3.2 视觉与交互

- 自定义 `CSS Variables`
- 结果页海报化布局
- 实验室档案 + 野性图鉴混合视觉语言

### 3.3 结果导出

- 浏览器原生 `Canvas`

用途：

- 导出结果海报
- 提高比赛展示完成度

这样做的原因：

- 避免依赖第三方 DOM 截图库
- 在受限浏览器环境下更稳定
- 便于统一海报版式与导出内容

### 3.4 AI 接入策略

前端不直接调用模型厂商接口，而是通过 `services/narrator.ts` 统一抽象。

当前支持：

- `mock`
- `proxy`
- `fallback`

叙事 Prompt 资产位于：

- `src/prompts/personaNarrator.ts`

服务抽象位于：

- `src/services/narrator.ts`

### 3.5 后端代理栈

- `Node.js 20+`
- 原生 `http`
- 原生 `fetch`
- 原生 ESM

这样做的原因：

- 不额外引入框架，适合比赛项目快速交付
- 代理职责单一，只处理密钥保护、结构化转发和错误兜底
- 便于评委快速理解“前端演示层 + AI 代理层”的工程拆分

### 3.6 测试与质量保障

- `Vitest`
- `V8 Coverage`
- 根目录统一脚本：`npm run test`、`npm run test:coverage`、`npm run verify`
- 单元测试文件集中存放在 `交付材料/单元测试/`

当前自动化测试覆盖范围：

- 题库随机抽取与结构校验
- 五维评分、原型排序与结果判读
- Prompt 用户提示词组装与本地回退文案生成

## 4. 目录规划

```text
交付材料/
  spec.md
  plan.md
  task.md
  单元测试/
    questionBank.test.ts
    scoring.test.ts
    personaNarrator.test.ts
docs/
  final-test-kit.md
  github-showcase.md
app/
  .env.example
  package.json
  vite.config.ts
  src/
    components/
    data/
    pages/
    prompts/
    router/
    services/
    stores/
    types/
    utils/
server/
  .env.example
  package.json
  src/
    env.mjs
    index.mjs
    narrationSchema.mjs
    openaiProxy.mjs
```

目录职责：

- `交付材料/`：比赛提交所需的 SDD 文档与单元测试主目录
- `交付材料/单元测试/`：老师验收时可直接查看的可执行测试文件
- `docs/`：展示材料、最终自测说明和答辩辅助文档
- `pages/`：页面级体验
- `data/`：题目、原型、维度数据
- `stores/`：测试流程状态和本地持久化
- `prompts/`：Prompt 模板与回退叙事逻辑
- `services/`：AI 服务层与代理接口调用
- `server/src/index.mjs`：HTTP 入口与路由
- `server/src/openaiProxy.mjs`：Responses API 转发与结构化校验
- `server/src/env.mjs`：本地环境变量读取
- `server/src/narrationSchema.mjs`：固定 JSON 输出字段约束

## 5. 环境配置

### 5.1 本地环境

- `Node.js 20+`
- `npm 10+`
- `Git`

### 5.2 启动命令

```bash
npm run dev:server
npm run dev:app
```

### 5.3 构建命令

```bash
npm run build
```

### 5.4 测试命令

```bash
npm run test
npm run test:coverage
npm run verify
```

说明：

- `npm run test`：运行前端核心逻辑单元测试
- `npm run test:coverage`：输出覆盖率报告
- `npm run verify`：构建加覆盖率一键验收

### 5.5 前端环境变量

文件：

- `app/.env.example`

当前变量：

```bash
VITE_NARRATOR_MODE=mock
VITE_NARRATOR_PROXY_URL=/api/persona/narrate
VITE_NARRATOR_MOCK_DELAY_MS=900
VITE_DEV_PROXY_TARGET=http://localhost:8787
```

说明：

- `VITE_NARRATOR_MODE=mock`：使用本地回退叙事，适合比赛演示
- `VITE_NARRATOR_MODE=proxy`：调用后端代理接口
- `VITE_NARRATOR_PROXY_URL`：前端请求地址
- `VITE_NARRATOR_MOCK_DELAY_MS`：模拟 AI 生成耗时
- `VITE_DEV_PROXY_TARGET`：本地联调时的 Vite 开发代理目标

### 5.6 后端环境变量

文件：

- `server/.env.example`

当前变量：

```bash
PORT=8787
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5.4-mini
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_AUTH_TOKEN=
CLOUDFLARE_MODEL=@cf/meta/llama-3.1-8b-instruct-fast
ALLOWED_ORIGIN=http://localhost:5173
```

说明：

- `AI_PROVIDER`：当前支持 `openai` 和 `cloudflare`
- `OPENAI_API_KEY`：真实模型调用密钥，只允许保存在后端
- `OPENAI_BASE_URL`：默认走官方 OpenAI API
- `OPENAI_MODEL`：默认使用轻量模型做结果叙事
- `CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_AUTH_TOKEN / CLOUDFLARE_MODEL`：Cloudflare Workers AI 配置
- `ALLOWED_ORIGIN`：允许本地前端跨域访问

## 6. Vite 开发代理

为方便联调，开发环境支持把 `/api` 转发到后端。

配置入口：

- `vite.config.ts`

使用方式：

```bash
VITE_DEV_PROXY_TARGET=http://localhost:8787
```

这样前端在 `proxy` 模式下请求 `/api/persona/narrate` 时，本地开发环境会转发到目标后端。

## 7. 数据与结果逻辑

### 7.1 核心链路

1. 用户完成场景题选择
2. 前端按会话随机抽取一轮题集并持久化
3. 前端累计五维人格得分
4. 计算与原型签名的距离
5. 选出主原型与次级原型
6. 生成结果页结构、结果置信度、模型内稀有度与相邻人格解释
7. 异步请求叙事层
8. 后端代理调用 OpenAI Responses API 或 Cloudflare Workers AI
9. 返回结果文本并渲染结果页

### 7.2 叙事层策略

当 AI 可用时：

- 发送系统提示词
- 发送结构化用户提示词
- 要求输出固定字段 JSON
- 检查返回文案是否过度空泛或偏离人格档案语气

当 AI 不可用时：

- 使用本地回退叙事函数生成可展示结果

当 AI 可用但文案质量过低时：

- 直接降级为本地回退叙事
- 在结果页提示本次使用了本地 dossier engine

### 7.3 异常边界与降级方案

- 结果页在用户未完成答题时显示引导页，不直接报错
- `/test` 刷新时保留当前进度；通过 `fresh=1` 新开测试时强制重新抽题
- 本地缓存版本不匹配或题集结构非法时自动清空并重建
- 海报直接下载失败时，结果页弹出页内预览层供手动保存
- AI 超时、结构错误、低质量文案、跨域失败时自动退回本地叙事

## 8. 当前阶段交付

当前已交付：

- 前端 MVP 工程
- 视觉强化版首页、测试页、结果页
- 本地题目数据与人格原型数据
- 多套母题随机抽取与题目顺序打乱
- AI 叙事 Prompt 资产
- AI 服务层抽象
- 原生 Canvas 结果海报导出
- 后端代理服务
- `GET /health` 健康检查
- `POST /api/persona/narrate` 结构化叙事接口
- 前后端本地代理联调配置
- Cloudflare Workers AI 免费模型接入
- Cloudflare JSON Mode 结构化返回验证
- Prompt 强化与低质量返回自动回退
- 结果置信度 / 稀有度 / 相邻人格解释
- 前端核心逻辑单元测试与覆盖率脚本
- 根目录交付材料目录整理

## 9. 下一阶段计划

下一阶段可选扩展：

1. 进一步优化结果页文案与分享卡版式
2. 输出比赛用截图、演示流程和答辩材料
3. 根据免费模型的文风继续收紧 Prompt
4. 根据答辩时间决定是否增加双人对比模式
