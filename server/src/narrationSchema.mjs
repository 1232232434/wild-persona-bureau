export const personaNarrationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['opener', 'fieldNote', 'pressurePattern', 'socialPattern', 'growthEdge', 'actionAdvice', 'shareLine'],
  properties: {
    opener: { type: 'string' },
    fieldNote: { type: 'string' },
    pressurePattern: { type: 'string' },
    socialPattern: { type: 'string' },
    growthEdge: { type: 'string' },
    actionAdvice: { type: 'string' },
    shareLine: { type: 'string' },
  },
}

export const narrationFields = Object.keys(personaNarrationSchema.properties)

export const isPersonaNarration = (value) => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return narrationFields.every((field) => typeof value[field] === 'string')
}
