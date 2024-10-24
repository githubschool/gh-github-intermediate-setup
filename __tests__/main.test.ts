import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'
import * as octokit from '../__fixtures__/octokit.js'
import { AllowedIssueAction, AllowedIssueCommentAction } from '../src/enums.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('@octokit/rest', async () => {
  class Octokit {
    constructor() {
      return octokit
    }
  }

  return {
    Octokit
  }
})

const events_getAction: jest.SpiedFunction<
  typeof import('../src/events.js').getAction
> = jest.fn()
const issues_parse: jest.SpiedFunction<
  typeof import('../src/github/issues.js').parse
> = jest.fn()
const actions_create: jest.SpiedFunction<
  typeof import('../src/actions.js').create
> = jest.fn()
const actions_close: jest.SpiedFunction<
  typeof import('../src/actions.js').close
> = jest.fn()
const actions_expire: jest.SpiedFunction<
  typeof import('../src/actions.js').expire
> = jest.fn()
const actions_addAdmin: jest.SpiedFunction<
  typeof import('../src/actions.js').addAdmin
> = jest.fn()
const actions_addUser: jest.SpiedFunction<
  typeof import('../src/actions.js').addUser
> = jest.fn()
const actions_removeAdmin: jest.SpiedFunction<
  typeof import('../src/actions.js').removeAdmin
> = jest.fn()
const actions_removeUser: jest.SpiedFunction<
  typeof import('../src/actions.js').removeUser
> = jest.fn()

jest.unstable_mockModule('../src/events.js', () => {
  return {
    getAction: events_getAction
  }
})
jest.unstable_mockModule('../src/github/issues.js', () => {
  return {
    parse: issues_parse
  }
})
jest.unstable_mockModule('../src/actions.js', () => {
  return {
    create: actions_create,
    close: actions_close,
    expire: actions_expire,
    addAdmin: actions_addAdmin,
    addUser: actions_addUser,
    removeAdmin: actions_removeAdmin,
    removeUser: actions_removeUser
  }
})

const main = await import('../src/main.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('main', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Skips Invalid Actions', async () => {
    events_getAction.mockReturnValue(undefined)

    await main.run()

    expect(actions_create).not.toHaveBeenCalled()
    expect(actions_close).not.toHaveBeenCalled()
    expect(actions_addAdmin).not.toHaveBeenCalled()
    expect(actions_addUser).not.toHaveBeenCalled()
    expect(actions_removeAdmin).not.toHaveBeenCalled()
    expect(actions_removeUser).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('Processes an Expire Event', async () => {
    events_getAction.mockReturnValue(AllowedIssueAction.EXPIRE)

    await main.run()

    expect(actions_expire).toHaveBeenCalledTimes(1)
  })

  it('Processes a Class Create Event', async () => {
    events_getAction.mockReturnValue(AllowedIssueAction.CREATE)

    await main.run()

    expect(actions_create).toHaveBeenCalledTimes(1)
  })

  it('Processes a Class Close Event', async () => {
    events_getAction.mockReturnValue(AllowedIssueAction.CLOSE)

    await main.run()

    expect(actions_close).toHaveBeenCalledTimes(1)
  })

  it('Processes an Add Admin Event', async () => {
    events_getAction.mockReturnValue(AllowedIssueCommentAction.ADD_ADMIN)

    await main.run()

    expect(actions_addAdmin).toHaveBeenCalledTimes(1)
  })

  it('Processes an Add User Event', async () => {
    events_getAction.mockReturnValue(AllowedIssueCommentAction.ADD_USER)

    await main.run()

    expect(actions_addUser).toHaveBeenCalledTimes(1)
  })

  it('Processes a Remove Admin Event', async () => {
    events_getAction.mockReturnValue(AllowedIssueCommentAction.REMOVE_ADMIN)

    await main.run()

    expect(actions_removeAdmin).toHaveBeenCalledTimes(1)
  })

  it('Processes a Remove User Event', async () => {
    events_getAction.mockReturnValue(AllowedIssueCommentAction.REMOVE_USER)

    await main.run()

    expect(actions_removeUser).toHaveBeenCalledTimes(1)
  })

  it('Comments if an Error Occurs', async () => {
    events_getAction.mockReturnValue(AllowedIssueAction.CREATE)
    actions_create.mockRejectedValue(new Error('Test Error'))

    await main.run()

    expect(mocktokit.rest.issues.createComment).toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalled()
  })
})
