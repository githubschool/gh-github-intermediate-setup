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

    it('Does nothing if the event does not exist', async () => {
      KeyboardInputManager.events = {}
      KeyboardInputManager.emit('test')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('restart()', () => {
    it('Emits a restart event', async () => {
      const preventDefault = jest.fn()
      const event = {
        preventDefault
      }
      const emit = jest
        .spyOn(KeyboardInputManager, 'emit')
        .mockImplementation(() => {})

      KeyboardInputManager.restart(event as unknown as Event)

      expect(emit).toHaveBeenCalledTimes(1)
      expect(preventDefault).toHaveBeenCalledTimes(1)
    })
  })

  describe('constructor', () => {
    it('Sets events and listens', async () => {
      // Lab 3: Git Bisect
      expect(true).toBe(false)
    })
  })

  describe('keepPlaying()', () => {
    it('Emits a keepPlaying event', async () => {
      const preventDefault = jest.fn()
      const event = {
        preventDefault
      }
      const emit = jest
        .spyOn(KeyboardInputManager, 'emit')
        .mockImplementation(() => {})

      KeyboardInputManager.keepPlaying(event as unknown as Event)

      expect(emit).toHaveBeenCalledTimes(1)
      expect(preventDefault).toHaveBeenCalledTimes(1)
    })
  })
})
