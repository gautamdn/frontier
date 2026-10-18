import { expect, test } from 'vitest'
import { ageInYears } from './age'

test('whole years when birthday has passed this year', () => {
  expect(ageInYears('2021-01-10', new Date('2026-10-18'))).toBe(5)
})

test('does not count a birthday that has not yet occurred this year', () => {
  expect(ageInYears('2021-12-25', new Date('2026-10-18'))).toBe(4)
})

test('turns the new age exactly on the birthday', () => {
  expect(ageInYears('2021-10-18', new Date('2026-10-18'))).toBe(5)
})

test('the day before the birthday is still the younger age', () => {
  expect(ageInYears('2021-10-18', new Date('2026-10-17'))).toBe(4)
})

test('newborn is zero', () => {
  expect(ageInYears('2026-10-18', new Date('2026-10-18'))).toBe(0)
})
