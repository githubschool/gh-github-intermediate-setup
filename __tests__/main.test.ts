import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'
import * as octokit from '../__fixtures__/octokit.js'
import { AllowedIssueAction } from '../src/enums.js'

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

const issues_parse: jest.SpiedFunction<
  typeof import('../src/github/issues.js').parse
> = jest.fn()
const issues_complete: jest.SpiedFunction<
  typeof import('../src/github/issues.js').complete
> = jest.fn()
const issues_close: jest.SpiedFunction<
  typeof import('../src/github/issues.js').close
> = jest.fn()
const issues_generateMessage: jest.SpiedFunction<
  typeof import('../src/github/issues.js').generateMessage
> = jest.fn()
const repos_generateRepoName: jest.SpiedFunction<
  typeof import('../src/github/repos.js').generateRepoName
> = jest.fn()
const repos_create: jest.SpiedFunction<
  typeof import('../src/github/repos.js').create
> = jest.fn()
const repos_configure: jest.SpiedFunction<
  typeof import('../src/github/repos.js').configure
> = jest.fn()
const teams_create: jest.SpiedFunction<
  typeof import('../src/github/teams.js').create
> = jest.fn()

jest.unstable_mockModule('../src/github/issues.js', () => {
  return {
    parse: issues_parse,
    complete: issues_complete,
    close: issues_close,
    generateMessage: issues_generateMessage
  }
})
jest.unstable_mockModule('../src/github/repos.js', () => {
  return {
    generateRepoName: repos_generateRepoName,
    create: repos_create,
    configure: repos_configure
  }
})
jest.unstable_mockModule('../src/github/teams.js', () => {
  return {
    create: teams_create
  }
})

const main = await import('../src/main.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('main', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  beforeEach(() => {
    // Reset testing inputs.
    github.context.eventName = 'issues'
  })

  describe('Validation', () => {
    it('Fails on an Invalid GitHub Event', async () => {
      github.context.eventName = 'push'

      await main.run()

      expect(core.setFailed).toHaveBeenCalledTimes(1)
      expect(core.setFailed).toHaveBeenCalledWith(
        'This action can only be run on `issues` and `issue_comment` events.'
      )
    })
  })

  describe('Class Create', () => {
    beforeEach(() => {
      issues_parse.mockReturnValue({
        action: AllowedIssueAction.CREATE,
        customerName: 'Nick Testing Industries',
        customerAbbr: 'NA1',
        startDate: new Date(2024, 10, 17),
        endDate: new Date(2024, 10, 20),
        administrators: [
          {
            handle: 'ncalteen',
            email: 'ncalteen@github.com'
          }
        ],
        attendees: [
          {
            handle: 'ncalteen-testuser',
            email: 'ncalteen+testuser@github.com'
          }
        ]
      })
    })

    it('Processes a Class Create Event', async () => {
      await main.run()

      expect(core.setFailed).not.toHaveBeenCalled()

      expect(teams_create).toHaveBeenCalledTimes(1)
      expect(repos_create).toHaveBeenCalledTimes(1)
      expect(repos_configure).toHaveBeenCalledTimes(1)
    })

    it('Comments if an Error Occurs', async () => {
      const error = new Error('Test Error')
      repos_create.mockRejectedValue(error)

      await main.run()

      expect(mocktokit.rest.issues.createComment).toHaveBeenCalledTimes(1)
      expect(core.setFailed).toHaveBeenCalledTimes(1)
      expect(core.setFailed).toHaveBeenCalledWith(error.message)
    })
  })
})
