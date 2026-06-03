import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ENV_FILENAMES = ['.env.local', '.env']

const parseEnvValue = (rawValue) => {
  const trimmed = rawValue.trim()

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

export const loadLocalEnv = (cwd = process.cwd()) => {
  for (const filename of ENV_FILENAMES) {
    const filePath = path.join(cwd, filename)

    if (!existsSync(filePath)) {
      continue
    }

    const fileContents = readFileSync(filePath, 'utf8')
    const lines = fileContents.split(/\r?\n/)

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')

      if (separatorIndex <= 0) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = parseEnvValue(trimmed.slice(separatorIndex + 1))

      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  }
}

export const readEnv = () => {
  loadLocalEnv()

  const aiProvider = process.env.AI_PROVIDER || ''
  const cloudflareToken = process.env.CLOUDFLARE_AUTH_TOKEN || process.env.CLOUDFLARE_API_TOKEN || ''

  return {
    port: Number(process.env.PORT || 8787),
    aiProvider: aiProvider.trim().toLowerCase() || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    cloudflareApiToken: cloudflareToken,
    cloudflareModel: process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct-fast',
    allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  }
}
