# Plan

## 1. 文档定位

本文件定义 `野性人格局` 怎么做，包括技术选型、目录结构、环境配置、AI 联调方式和当前工程推进策略。

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

- `html-to-image`

用途：

- 导出结果页分享卡
- 提高比赛展示完成度

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

## 4. 目录规划

```text
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
- `npm 11+` 或 `pnpm 9+`
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

### 5.4 环境变量

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

### 5.5 后端环境变量

文件：

- `server/.env.example`

当前变量：

```bash
PORT=8787
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5.4-mini
ALLOWED_ORIGIN=http://localhost:5173
```

说明：

- `OPENAI_API_KEY`：真实模型调用密钥，只允许保存在后端
- `OPENAI_BASE_URL`：默认走官方 OpenAI API
- `OPENAI_MODEL`：默认使用轻量模型做结果叙事
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
2. 前端累计五维人格得分
3. 计算与原型签名的距离
4. 选出主原型与次级原型
5. 生成结果页结构
6. 异步请求叙事层
7. 后端代理调用 OpenAI Responses API
8. 返回结果文本并渲染结果页

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

## 8. 当前阶段交付

当前已交付：

- 前端 MVP 工程
- 视觉强化版首页、测试页、结果页
- 本地题目数据与人格原型数据
- AI 叙事 Prompt 资产
- AI 服务层抽象
- 结果页导出分享卡
- 后端代理服务
- `GET /health` 健康检查
- `POST /api/persona/narrate` 结构化叙事接口
- 前后端本地代理联调配置
- Cloudflare Workers AI 免费模型接入
- Cloudflare JSON Mode 结构化返回验证
- Prompt 强化与低质量返回自动回退

## 9. 下一阶段计划

下一阶段聚焦：

1. 进一步优化结果页文案与分享卡版式
2. 输出比赛用截图、演示流程和答辩材料
3. 根据免费模型的文风继续收紧 Prompt
4. 根据答辩时间决定是否增加双人对比模式
