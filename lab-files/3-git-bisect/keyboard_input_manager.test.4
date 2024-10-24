import { jest } from '@jest/globals'

const { KeyboardInputManager } = await import(
  '../src/keyboard_input_manager.js'
)

describe('KeyboardInputManager', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('on()', () => {
    it('Registers an event listener', async () => {
      KeyboardInputManager.events['test'] = []

      KeyboardInputManager.on('test', () => {})

      expect(KeyboardInputManager.events['test'].length).toBe(1)
    })

    it('Creates an listener array if it does not exist', async () => {
      KeyboardInputManager.events = {}

      KeyboardInputManager.on('test', () => {})

      expect(KeyboardInputManager.events['test'].length).toBe(1)
    })
  })

  describe('emit()', () => {
    let callback1: any
    let callback2: any

    beforeEach(() => {
      callback1 = jest.fn()
      callback2 = jest.fn()
    })

    it('Emits an event to all listeners', async () => {
      KeyboardInputManager.events['test'] = [callback1, callback2]
      KeyboardInputManager.emit('test')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('Passes data to listeners', async () => {
      KeyboardInputManager.events['test'] = [callback1, callback2]
      KeyboardInputManager.emit('test', 'data')

      expect(callback1).toHaveBeenCalledWith('data')
      expect(callback2).toHaveBeenCalledWith('data')
    })
  })
})
