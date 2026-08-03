import type { Archetype } from '../types/quiz'
import type { PersonaNarration } from '../prompts/personaNarrator'
import type { ResultMetric } from '../types/quiz'

interface PosterDimension {
  label: string
  low: string
  high: string
  value: number
}

export interface ResultPosterPayload {
  result: Archetype
  runnerUp: Archetype
  runnerUpMatch: number
  match: number
  reportCode: string
  dominantDimensionLabel: string
  confidence: ResultMetric | null
  rarity: ResultMetric | null
  adjacentInsightTitle: string
  narration: PersonaNarration
  dimensions: PosterDimension[]
  advice: string[]
}

const palette = {
  bg0: '#091110',
  bg1: '#10201d',
  panel: 'rgba(18, 29, 26, 0.96)',
  panelSoft: 'rgba(22, 36, 32, 0.92)',
  line: 'rgba(217, 197, 148, 0.16)',
  lineStrong: 'rgba(217, 197, 148, 0.28)',
  text: '#f3ead6',
  muted: '#bcae90',
  accent: '#d6bf86',
  accent2: '#7ca695',
  accent3: '#d38269',
  badgeText: '#16120b',
}

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const roundRectPath = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const cappedRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + cappedRadius, y)
  context.arcTo(x + width, y, x + width, y + height, cappedRadius)
  context.arcTo(x + width, y + height, x, y + height, cappedRadius)
  context.arcTo(x, y + height, x, y, cappedRadius)
  context.arcTo(x, y, x + width, y, cappedRadius)
  context.closePath()
}

const fillRoundedPanel = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient,
  strokeStyle = palette.line,
) => {
  roundRectPath(context, x, y, width, height, radius)
  context.fillStyle = fillStyle
  context.fill()
  context.strokeStyle = strokeStyle
  context.lineWidth = 1
  context.stroke()
}

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = Number.POSITIVE_INFINITY,
) => {
  const lines: string[] = []
  let current = ''

  for (const char of text) {
    const next = `${current}${char}`

    if (context.measureText(next).width <= maxWidth || current.length === 0) {
      current = next
      continue
    }

    lines.push(current)

    if (lines.length >= maxLines) {
      return lines
    }

    current = char
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  return lines
}

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Number.POSITIVE_INFINITY,
) => {
  const lines = wrapText(context, text, maxWidth, maxLines)

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight)
  })

  return y + lines.length * lineHeight
}

const drawPill = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  background = 'rgba(214, 191, 134, 0.08)',
  color = palette.accent,
) => {
  context.save()
  context.font = '500 24px "Sora", "Segoe UI", sans-serif'
  const width = context.measureText(text).width + 42
  const height = 42

  fillRoundedPanel(context, x, y, width, height, 21, background, palette.lineStrong)

  context.fillStyle = color
  context.textBaseline = 'middle'
  context.fillText(text, x + 21, y + height / 2)
  context.restore()

  return width
}

const drawBulletList = (
  context: CanvasRenderingContext2D,
  items: string[],
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
  let cursorY = y

  for (const item of items) {
    context.fillStyle = palette.text
    context.fillText('•', x, cursorY)
    context.fillStyle = palette.muted
    cursorY = drawWrappedText(context, item, x + 24, cursorY, maxWidth - 24, lineHeight) + 12
  }

  return cursorY
}

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('海报导出失败'))
    }, 'image/png')
  })

export const renderResultPoster = async (payload: ResultPosterPayload) => {
  if ('fonts' in document) {
    await document.fonts.ready
  }

  const width = 1440
  const height = 2680
  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('浏览器不支持画布导出')
  }

  context.textBaseline = 'top'

  const backgroundGradient = context.createLinearGradient(0, 0, width, height)
  backgroundGradient.addColorStop(0, palette.bg0)
  backgroundGradient.addColorStop(0.55, palette.bg1)
  backgroundGradient.addColorStop(1, '#0a120f')
  context.fillStyle = backgroundGradient
  context.fillRect(0, 0, width, height)

  for (let x = 0; x <= width; x += 84) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
  }

  for (let y = 0; y <= height; y += 84) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }

  const glowA = context.createRadialGradient(240, 220, 20, 240, 220, 320)
  glowA.addColorStop(0, 'rgba(124, 166, 149, 0.22)')
  glowA.addColorStop(1, 'rgba(124, 166, 149, 0)')
  context.fillStyle = glowA
  context.fillRect(0, 0, width, height)

  const glowB = context.createRadialGradient(1180, 250, 40, 1180, 250, 300)
  glowB.addColorStop(0, 'rgba(214, 191, 134, 0.22)')
  glowB.addColorStop(1, 'rgba(214, 191, 134, 0)')
  context.fillStyle = glowB
  context.fillRect(0, 0, width, height)

  fillRoundedPanel(context, 48, 48, width - 96, height - 96, 38, 'rgba(11, 18, 16, 0.7)')

  const heroX = 88
  const heroY = 88
  const heroWidth = width - 176
  const heroHeight = 560
  const heroGradient = context.createLinearGradient(heroX, heroY, heroX + heroWidth, heroY + heroHeight)
  heroGradient.addColorStop(0, 'rgba(24, 37, 33, 0.98)')
  heroGradient.addColorStop(1, 'rgba(11, 17, 16, 0.98)')
  fillRoundedPanel(context, heroX, heroY, heroWidth, heroHeight, 30, heroGradient)

  roundRectPath(context, heroX + 20, heroY + 20, heroWidth - 40, heroHeight - 40, 24)
  context.strokeStyle = 'rgba(214, 191, 134, 0.18)'
  context.setLineDash([8, 10])
  context.stroke()
  context.setLineDash([])

  context.font = '600 22px "Sora", "Segoe UI", sans-serif'
  drawPill(context, heroX + 42, heroY + 42, '人格档案')

  context.fillStyle = palette.muted
  context.font = '500 22px "Sora", "Segoe UI", sans-serif'
  context.fillText('野性人格局', heroX + 42, heroY + 108)
  context.fillText(`档案编号 ${payload.reportCode}`, heroX + 42, heroY + 144)

  context.fillStyle = palette.text
  context.font = '700 88px "Noto Serif SC", "Microsoft YaHei", serif'
  let cursorY = drawWrappedText(context, payload.result.name, heroX + 42, heroY + 190, 760, 98, 2)

  context.fillStyle = 'rgba(243, 234, 214, 0.8)'
  context.font = '600 34px "Noto Serif SC", "Microsoft YaHei", serif'
  cursorY = drawWrappedText(context, payload.result.animal, heroX + 42, cursorY + 8, 760, 40, 1)

  context.fillStyle = palette.text
  context.font = '600 42px "Noto Serif SC", "Microsoft YaHei", serif'
  cursorY = drawWrappedText(context, payload.result.title, heroX + 42, cursorY + 28, 760, 54, 3)

  let traitX = heroX + 42
  const traitY = heroY + heroHeight - 84
  payload.result.traits.forEach((trait) => {
    traitX += drawPill(context, traitX, traitY, trait, 'rgba(214, 191, 134, 0.06)', palette.text) + 12
  })

  const sealX = heroX + heroWidth - 280
  const sealY = heroY + heroHeight - 228
  context.beginPath()
  context.arc(sealX + 110, sealY + 110, 110, 0, Math.PI * 2)
  const sealGradient = context.createRadialGradient(sealX + 110, sealY + 92, 10, sealX + 110, sealY + 110, 110)
  sealGradient.addColorStop(0, 'rgba(214, 191, 134, 0.28)')
  sealGradient.addColorStop(1, 'rgba(11, 18, 16, 0.9)')
  context.fillStyle = sealGradient
  context.fill()
  context.strokeStyle = 'rgba(214, 191, 134, 0.28)'
  context.lineWidth = 2
  context.stroke()

  context.fillStyle = palette.muted
  context.font = '500 20px "Sora", "Segoe UI", sans-serif'
  context.textAlign = 'center'
  context.fillText('匹配度', sealX + 110, sealY + 70)
  context.fillStyle = palette.text
  context.font = '700 64px "Cormorant Garamond", "Noto Serif SC", serif'
  context.fillText(`${payload.match}%`, sealX + 110, sealY + 102)
  context.textAlign = 'left'

  const infoCardY = heroY + heroHeight + 24
  const infoCardWidth = (heroWidth - 24) / 2
  fillRoundedPanel(context, heroX, infoCardY, infoCardWidth, 256, 26, palette.panelSoft)
  fillRoundedPanel(context, heroX + infoCardWidth + 24, infoCardY, infoCardWidth, 256, 26, palette.panelSoft)

  context.fillStyle = palette.muted
  context.font = '500 20px "Sora", "Segoe UI", sans-serif'
  context.fillText('你更容易发光的场景', heroX + 34, infoCardY + 30)
  context.fillStyle = palette.text
  context.font = '600 34px "Noto Serif SC", "Microsoft YaHei", serif'
  let textY = drawWrappedText(context, payload.result.habitat, heroX + 34, infoCardY + 72, infoCardWidth - 68, 42, 4)
  context.fillStyle = palette.muted
  context.font = '500 24px "Sora", "Segoe UI", sans-serif'
  drawWrappedText(context, payload.result.summary, heroX + 34, textY + 18, infoCardWidth - 68, 34, 4)

  const metaCardX = heroX + infoCardWidth + 24
  context.fillStyle = palette.muted
  context.font = '500 20px "Sora", "Segoe UI", sans-serif'
  context.fillText('人生格言', metaCardX + 34, infoCardY + 30)
  context.fillStyle = palette.text
  context.font = '600 40px "Noto Serif SC", "Microsoft YaHei", serif'
  drawWrappedText(context, payload.result.contrast, metaCardX + 34, infoCardY + 72, infoCardWidth - 68, 52, 3)

  context.fillStyle = palette.muted
  context.font = '500 22px "Sora", "Segoe UI", sans-serif'
  context.fillText(`隐藏副属性：${payload.runnerUp.animal}`, metaCardX + 34, infoCardY + 184)
  context.fillText(`最强倾向：${payload.dominantDimensionLabel}`, metaCardX + 34, infoCardY + 218)

  const metricsY = infoCardY + 280
  const metricGap = 18
  const metricCardWidth = (heroWidth - metricGap * 2) / 3
  const metricCardHeight = 212

  const metricCards = [
    {
      title: '像不像你',
      score: payload.confidence?.score ?? payload.match,
      label: payload.confidence?.label ?? '主线很清楚',
      summary: payload.confidence?.summary ?? '你的主要选择正在指向同一种气质。',
    },
    {
      title: '人设记忆点',
      score: payload.rarity?.score ?? 58,
      label: payload.rarity?.label ?? '辨识度很高',
      summary: payload.rarity?.summary ?? '你的组合有比较清楚的个人味道。',
    },
    {
      title: '隐藏副属性',
      score: payload.runnerUpMatch,
      label: payload.runnerUp.animal,
      summary: payload.adjacentInsightTitle,
    },
  ]

  metricCards.forEach((card, index) => {
    const cardX = heroX + index * (metricCardWidth + metricGap)
    fillRoundedPanel(context, cardX, metricsY, metricCardWidth, metricCardHeight, 24, palette.panelSoft)
    context.fillStyle = palette.muted
    context.font = '500 18px "Sora", "Segoe UI", sans-serif'
    context.fillText(card.title, cardX + 24, metricsY + 24)

    context.fillStyle = palette.text
    context.font = '700 58px "Cormorant Garamond", "Noto Serif SC", serif'
    context.fillText(String(card.score), cardX + 24, metricsY + 56)
    context.fillStyle = palette.muted
    context.font = '500 18px "Sora", "Segoe UI", sans-serif'
    context.fillText(card.title === '隐藏副属性' ? '相似度' : '/ 100', cardX + 110, metricsY + 84)

    context.fillStyle = palette.text
    context.font = '600 26px "Noto Serif SC", "Microsoft YaHei", serif'
    drawWrappedText(context, card.label, cardX + 24, metricsY + 124, metricCardWidth - 48, 32, 2)
    context.fillStyle = palette.muted
    context.font = '500 18px "Sora", "Segoe UI", sans-serif'
    drawWrappedText(context, card.summary, cardX + 24, metricsY + 160, metricCardWidth - 48, 28, 2)
  })

  const narrativeY = metricsY + metricCardHeight + 24
  fillRoundedPanel(context, heroX, narrativeY, heroWidth, 548, 28, palette.panel)

  context.fillStyle = palette.muted
  context.font = '500 20px "Sora", "Segoe UI", sans-serif'
  context.fillText('结果讲述', heroX + 34, narrativeY + 30)
  context.fillStyle = palette.text
  context.font = '700 44px "Noto Serif SC", "Microsoft YaHei", serif'
  drawWrappedText(context, payload.narration.opener, heroX + 34, narrativeY + 66, 860, 54, 2)
  drawPill(context, heroX + heroWidth - 300, narrativeY + 36, payload.narration.shareLine, 'rgba(124, 166, 149, 0.08)', palette.text)

  const narrativeBlocks = [
    ['你做事的方式', payload.narration.fieldNote],
    ['你受压时的样子', payload.narration.pressurePattern],
    ['你和人相处的方式', payload.narration.socialPattern],
    ['你要留意的失衡点', payload.narration.growthEdge],
  ]

  const narrativeColumnWidth = (heroWidth - 34 * 2 - 18) / 2
  const narrativeStartY = narrativeY + 160

  narrativeBlocks.forEach(([title, text], index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const blockX = heroX + 34 + column * (narrativeColumnWidth + 18)
    const blockY = narrativeStartY + row * 146

    fillRoundedPanel(context, blockX, blockY, narrativeColumnWidth, 128, 20, 'rgba(255, 255, 255, 0.03)')
    context.fillStyle = palette.muted
    context.font = '500 18px "Sora", "Segoe UI", sans-serif'
    context.fillText(title, blockX + 20, blockY + 18)
    context.fillStyle = palette.text
    context.font = '500 22px "Sora", "Segoe UI", sans-serif'
    drawWrappedText(context, text, blockX + 20, blockY + 48, narrativeColumnWidth - 40, 32, 3)
  })

  const meterY = narrativeY + 572
  fillRoundedPanel(context, heroX, meterY, heroWidth, 340, 28, palette.panelSoft)
  context.fillStyle = palette.muted
  context.font = '500 20px "Sora", "Segoe UI", sans-serif'
  context.fillText('你的五维画像', heroX + 34, meterY + 30)

  payload.dimensions.forEach((dimension, index) => {
    const top = meterY + 76 + index * 48
    context.fillStyle = palette.text
    context.font = '600 22px "Sora", "Segoe UI", sans-serif'
    context.fillText(dimension.label, heroX + 34, top)
    context.fillStyle = palette.muted
    context.font = '500 20px "Sora", "Segoe UI", sans-serif'
    context.fillText(`${dimension.value} / 100`, heroX + heroWidth - 164, top)

    const railX = heroX + 260
    const railY = top + 8
    const railWidth = heroWidth - 460
    fillRoundedPanel(context, railX, railY, railWidth, 14, 7, 'rgba(255, 255, 255, 0.06)', palette.line)
    const fill = context.createLinearGradient(railX, 0, railX + railWidth, 0)
    fill.addColorStop(0, palette.accent2)
    fill.addColorStop(1, palette.accent)
    roundRectPath(context, railX, railY, (railWidth * dimension.value) / 100, 14, 7)
    context.fillStyle = fill
    context.fill()

    context.fillStyle = palette.muted
    context.font = '500 18px "Sora", "Segoe UI", sans-serif'
    context.fillText(dimension.low, railX, top + 24)
    context.textAlign = 'right'
    context.fillText(dimension.high, railX + railWidth, top + 24)
    context.textAlign = 'left'
  })

  const bottomY = meterY + 364
  fillRoundedPanel(context, heroX, bottomY, heroWidth, 452, 28, palette.panel)
  const columnWidth = (heroWidth - 34 * 2 - 24) / 2

  context.fillStyle = palette.muted
  context.font = '500 20px "Sora", "Segoe UI", sans-serif'
  context.fillText('你已经很强的地方', heroX + 34, bottomY + 30)
  context.fillText('你可以这样用好自己', heroX + 34 + columnWidth + 24, bottomY + 30)

  context.fillStyle = palette.text
  context.font = '500 24px "Sora", "Segoe UI", sans-serif'
  drawBulletList(context, payload.result.strengths, heroX + 34, bottomY + 70, columnWidth, 34)
  drawBulletList(context, payload.advice, heroX + 34 + columnWidth + 24, bottomY + 70, columnWidth, 34)

  fillRoundedPanel(
    context,
    heroX + 34,
    bottomY + 296,
    heroWidth - 68,
    120,
    22,
    'rgba(214, 191, 134, 0.06)',
    palette.lineStrong,
  )
  context.fillStyle = palette.muted
  context.font = '500 18px "Sora", "Segoe UI", sans-serif'
  context.fillText('给你的提醒', heroX + 56, bottomY + 318)
  context.fillStyle = palette.text
  context.font = '600 28px "Noto Serif SC", "Microsoft YaHei", serif'
  drawWrappedText(context, payload.result.warning, heroX + 56, bottomY + 352, heroWidth - 112, 36, 2)

  return toBlob(canvas)
}
