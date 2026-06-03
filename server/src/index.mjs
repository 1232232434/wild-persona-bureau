import http from 'node:http'

import { readEnv } from './env.mjs'
import { ProxyRequestError, requestPersonaNarration } from './openaiProxy.mjs'

const env = readEnv()

class RequestError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'RequestError'
    this.statusCode = statusCode
  }
}

const sendJson = (response, statusCode, payload, extraHeaders = {}) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': env.allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    ...extraHeaders,
  })

  response.end(JSON.stringify(payload))
}

const readBody = (request) =>
  new Promise((resolve, reject) => {
    const chunks = []

    request.on('data', (chunk) => {
      chunks.push(chunk)
    })

    request.on('end', () => {
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8')
        resolve(rawBody ? JSON.parse(rawBody) : {})
      } catch (error) {
        reject(new RequestError('Request body must be valid JSON', 400))
      }
    })

    request.on('error', reject)
  })

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  const pathname = url.pathname

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': env.allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    })
    response.end()
    return
  }

  if (request.method === 'GET' && pathname === '/health') {
    sendJson(response, 200, {
      ok: true,
      service: 'wild-persona-bureau-server',
      provider: env.aiProvider,
      model: env.aiProvider === 'cloudflare' ? env.cloudflareModel : env.openaiModel,
      credentialsReady:
        env.aiProvider === 'cloudflare'
          ? Boolean(env.cloudflareAccountId && env.cloudflareApiToken)
          : Boolean(env.openaiApiKey),
    })
    return
  }

  if (request.method === 'POST' && pathname === '/api/persona/narrate') {
    try {
      const body = await readBody(request)

      if (typeof body.systemPrompt !== 'string' || typeof body.userPrompt !== 'string') {
        sendJson(response, 400, {
          error: 'systemPrompt and userPrompt must both be strings',
        })
        return
      }

      const result = await requestPersonaNarration({
        provider: env.aiProvider,
        baseUrl: env.openaiBaseUrl,
        apiKey: env.openaiApiKey,
        model: env.openaiModel,
        systemPrompt: body.systemPrompt,
        userPrompt: body.userPrompt,
        input: body.input ?? null,
        cloudflareAccountId: env.cloudflareAccountId,
        cloudflareApiToken: env.cloudflareApiToken,
        cloudflareModel: env.cloudflareModel,
      })

      sendJson(response, 200, result)
      return
    } catch (error) {
      const statusCode =
        error instanceof RequestError || error instanceof ProxyRequestError
          ? error.statusCode
          : 500
      const payload = {
        error: error instanceof Error ? error.message : 'Unknown server error',
      }

      if (error instanceof ProxyRequestError && typeof error.upstreamStatus === 'number') {
        payload.upstreamStatus = error.upstreamStatus
      }

      sendJson(response, statusCode, payload)
      return
    }
  }

  sendJson(response, 404, { error: 'Not found' })
})

server.listen(env.port, () => {
  console.log(`Wild Persona Bureau server listening on http://localhost:${env.port}`)
})
