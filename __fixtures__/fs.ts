import { jest } from '@jest/globals'

export const readFileSync = jest.fn().mockImplementation(() => {
  return 'Some content'
})
export const writeFileSync = jest.fn()

export default {
  readFileSync,
  writeFileSync
}
