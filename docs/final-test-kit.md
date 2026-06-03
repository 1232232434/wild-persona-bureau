# Final Test Kit

这份文档给最后交付前的快速自测使用，目标是在 5 到 10 分钟内确认项目可演示、可提交。

## 1. 启动命令

先启动后端：

```bash
npm run dev:server
```

再启动前端：

```bash
npm run dev:app
```

构建验证：

```bash
npm run build
```

## 2. PowerShell 接口测试码

### 2.1 检查后端健康状态

```powershell
Invoke-RestMethod -Uri 'http://localhost:8787/health' -Method Get
```

预期重点：

- `ok` 为 `true`
- `provider` 为 `cloudflare` 或当前配置的提供方
- `credentialsReady` 为 `true`

### 2.2 检查 AI 叙事接口

```powershell
$body = @{
  systemPrompt = 'Return structured JSON only.'
  userPrompt = 'Return fields opener, fieldNote, pressurePattern, socialPattern, growthEdge, shareLine.'
  input = @{ demo = $true }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri 'http://localhost:8787/api/persona/narrate' `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body
```

预期重点：

- 返回对象里有 `narration`
- `narration` 内包含：
  - `opener`
  - `fieldNote`
  - `pressurePattern`
  - `socialPattern`
  - `growthEdge`
  - `shareLine`

## 3. 页面自测清单

### 首页

- 能看到 `Wild Persona Bureau / 野性人格局`
- 能点击 `Start The Experiment`
- 能点击 `Preview The Result Board`

### 测试页

- 顶部进度正常变化
- 一共显示 `10` 个场景题
- `Previous` 和 `Restart` 按钮工作正常

### 结果页

- 能看到主原型、次级原型、五维结果
- AI 叙事区域能正常加载
- `Regenerate` 可重复触发
- `Export share card` 可导出图片

## 4. 交付前最后确认

- `README.md` 可直接当 GitHub 首页展示
- `docs/spec.md`、`docs/plan.md`、`docs/task.md` 三文档齐全
- `docs/github-showcase.md` 可直接拿来做答辩话术参考
- `mock / proxy / fallback` 三种模式都可解释

## 5. 如果现场网络不稳

把前端改成 `mock` 模式即可：

```env
VITE_NARRATOR_MODE=mock
```

这样仍然可以完整演示产品主流程，不会因为模型波动影响交付。
