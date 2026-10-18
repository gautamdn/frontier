import { expect, test } from 'vitest'
import { fillName } from './format'

test('replaces a single placeholder', () => {
  expect(fillName('Could {{name}} count to ten?', 'Kavya')).toBe(
    'Could Kavya count to ten?',
  )
})

test('replaces every occurrence', () => {
  expect(fillName('{{name}} and {{name}}', 'Kavya')).toBe('Kavya and Kavya')
})

test('tolerates inner whitespace in the placeholder', () => {
  expect(fillName('Hi {{ name }}', 'Kai')).toBe('Hi Kai')
})

test('leaves text without a placeholder unchanged', () => {
  expect(fillName('No placeholder here', 'Kavya')).toBe('No placeholder here')
})
