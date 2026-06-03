import { describe, expect, it } from 'vitest'

import { buildQuestionSet, isValidQuestionSet, questionSetSize } from '../../app/src/data/questionBank'

describe('questionBank', () => {
  it('buildQuestionSet should create one valid question per group', () => {
    const sequence = [0.12, 0.86, 0.35, 0.61, 0.44, 0.93]
    let index = 0
    const random = () => {
      const value = sequence[index % sequence.length]
      index += 1
      return value
    }

    const questionSet = buildQuestionSet(random)

    expect(questionSet).toHaveLength(questionSetSize)
    expect(isValidQuestionSet(questionSet)).toBe(true)
    expect(new Set(questionSet.map((question) => question.id)).size).toBe(questionSetSize)
  })

  it('isValidQuestionSet should reject duplicate question groups', () => {
    const questionSet = buildQuestionSet(() => 0.25)
    const duplicatedSet = [...questionSet]

    duplicatedSet[1] = duplicatedSet[0]

    expect(isValidQuestionSet(duplicatedSet)).toBe(false)
  })

  it('isValidQuestionSet should reject tampered option identifiers', () => {
    const questionSet = buildQuestionSet(() => 0.4)
    const tamperedSet = questionSet.map((question, questionIndex) =>
      questionIndex === 0
        ? {
            ...question,
            options: question.options.map((option, optionIndex) =>
              optionIndex === 0 ? { ...option, id: `${option.id}-invalid` } : option,
            ),
          }
        : question,
    )

    expect(isValidQuestionSet(tamperedSet)).toBe(false)
  })
})
