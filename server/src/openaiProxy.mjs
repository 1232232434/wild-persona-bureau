import { isPersonaNarration, personaNarrationSchema } from './narrationSchema.mjs'

export class ProxyRequestError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message)
    this.name = 'ProxyRequestError'
    this.statusCode = statusCode
    this.upstreamStatus = options.upstreamStatus
  }
}

const buildResponsePayload = ({ systemPrompt, userPrompt, input, model }) => ({
  model,
  input: [
    {
      role: 'system',
      content: [{ type: 'input_text', text: systemPrompt }],
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text:
            userPrompt ||
            `Generate a persona narration for this structured input:\n${JSON.stringify(input, null, 2)}`,
        },
      ],
    },
  ],
  text: {
    format: {
      type: 'json_schema',
      name: 'persona_narration',
      strict: true,
      schema: personaNarrationSchema,
    },
  },
})

const buildCloudflarePayload = ({ systemPrompt, userPrompt, input }) => ({
  messages: [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content:
        userPrompt ||
        `Generate a persona narration for this structured input:\n${JSON.stringify(input, null, 2)}`,
    },
  ],
  response_format: {
    type: 'json_schema',
    json_schema: personaNarrationSchema,
  },
})

const extractOutputText = (payload) => {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text
  }

  const firstMessage = Array.isArray(payload.output)
    ? payload.output.find((item) => item?.type === 'message')
    : null

  const firstTextPart = firstMessage?.content?.find((item) => item?.type === 'output_text')

  return typeof firstTextPart?.text === 'string' ? firstTextPart.text : ''
}

const readJsonPayload = async (response) => {
  const rawText = await response.text()

  if (!rawText.trim()) {
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    throw new ProxyRequestError('OpenAI returned a non-JSON response', 502, {
      upstreamStatus: response.status,
    })
  }
}

const readCloudflarePayload = async (response) => {
  const rawText = await response.text()

  if (!rawText.trim()) {
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    throw new ProxyRequestError('Cloudflare returned a non-JSON response', 502, {
      upstreamStatus: response.status,
    })
  }
}

const extractCloudflareNarration = (payload) => {
  const candidate = payload?.result?.response

  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    return candidate
  }

  if (typeof candidate === 'string' && candidate.trim()) {
    try {
      return JSON.parse(candidate)
    } catch {
      throw new ProxyRequestError('Cloudflare JSON Mode returned an unparsable string', 502)
    }
  }

  throw new ProxyRequestError('Cloudflare response did not contain a structured narration payload', 502)
}

export const requestPersonaNarration = async ({
  provider = 'openai',
  baseUrl,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  input,
  cloudflareAccountId,
  cloudflareApiToken,
  cloudflareModel,
}) => {
  if (provider === 'cloudflare') {
    if (!cloudflareApiToken) {
      throw new ProxyRequestError('CLOUDFLARE_AUTH_TOKEN is missing', 500)
    }

    if (!cloudflareAccountId) {
      throw new ProxyRequestError('CLOUDFLARE_ACCOUNT_ID is missing', 500)
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/${cloudflareModel}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cloudflareApiToken}`,
        },
        body: JSON.stringify(
          buildCloudflarePayload({
            systemPrompt,
            userPrompt,
            input,
          }),
        ),
      },
    )

    const payload = await readCloudflarePayload(response)

    if (!response.ok || payload?.success === false) {
      const message =
        payload?.errors?.[0]?.message ||
        payload?.result?.error ||
        payload?.message ||
        `Cloudflare request failed with status ${response.status}`

      throw new ProxyRequestError(message, response.status || 502, {
        upstreamStatus: response.status,
      })
    }

    const narration = extractCloudflareNarration(payload)

    if (!isPersonaNarration(narration)) {
      throw new ProxyRequestError('Cloudflare output did not match the narration schema', 502, {
        upstreamStatus: response.status,
      })
    }

    return {
      narration,
      meta: {
        model: cloudflareModel,
        response_id: payload?.result?.id || null,
        provider: 'cloudflare',
      },
    }
  }

  if (!apiKey) {
    throw new ProxyRequestError('OPENAI_API_KEY is missing', 500)
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(
      buildResponsePayload({
        systemPrompt,
        userPrompt,
        input,
        model,
      }),
    ),
  })

  const payload = await readJsonPayload(response)

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `OpenAI request failed with status ${response.status}`

    throw new ProxyRequestError(message, 502, {
      upstreamStatus: response.status,
    })
  }

  const outputText = extractOutputText(payload)

  if (!outputText) {
    throw new ProxyRequestError('OpenAI response did not contain output_text', 502, {
      upstreamStatus: response.status,
    })
  }

  let narration

  try {
    narration = JSON.parse(outputText)
  } catch (error) {
    throw new ProxyRequestError(
      `Failed to parse OpenAI JSON output: ${error instanceof Error ? error.message : 'unknown error'}`,
      502,
      {
        upstreamStatus: response.status,
      },
    )
  }

  if (!isPersonaNarration(narration)) {
    throw new ProxyRequestError('OpenAI output did not match the narration schema', 502, {
      upstreamStatus: response.status,
    })
  }

  return {
    narration,
    meta: {
      model: payload.model || model,
      response_id: payload.id,
      provider: 'openai',
    },
  }
}
