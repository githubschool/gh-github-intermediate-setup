import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'
import * as octokit from '../__fixtures__/octokit.js'
import { AllowedIssueAction } from '../src/enums.js'

jest.useFakeTimers()
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

const issues_addLabels: jest.SpiedFunction<
  typeof import('../src/github/issues.js').addLabels
> = jest.fn()
const issues_complete: jest.SpiedFunction<
  typeof import('../src/github/issues.js').complete
> = jest.fn()
const issues_generateMessage: jest.SpiedFunction<
  typeof import('../src/github/issues.js').generateMessage
> = jest.fn()
const issues_parse: jest.SpiedFunction<
  typeof import('../src/github/issues.js').parse
> = jest.fn()
const repos_exists: jest.SpiedFunction<
  typeof import('../src/github/repos.js').exists
> = jest.fn()
const repos_create: jest.SpiedFunction<
  typeof import('../src/github/repos.js').create
> = jest.fn()
const repos_configure: jest.SpiedFunction<
  typeof import('../src/github/repos.js').configure
> = jest.fn()
const repos_generateRepoName: jest.SpiedFunction<
  typeof import('../src/github/repos.js').generateRepoName
> = jest.fn()
const repos_deleteRepositories: jest.SpiedFunction<
  typeof import('../src/github/repos.js').deleteRepositories
> = jest.fn()
const teams_exists: jest.SpiedFunction<
  typeof import('../src/github/teams.js').exists
> = jest.fn()
const teams_generateTeamName: jest.SpiedFunction<
  typeof import('../src/github/teams.js').generateTeamName
> = jest.fn()
const teams_create: jest.SpiedFunction<
  typeof import('../src/github/teams.js').create
> = jest.fn()
const teams_deleteTeam: jest.SpiedFunction<
  typeof import('../src/github/teams.js').deleteTeam
> = jest.fn()
const teams_addUser: jest.SpiedFunction<
  typeof import('../src/github/teams.js').addUser
> = jest.fn()
const teams_get: jest.SpiedFunction<
  typeof import('../src/github/teams.js').get
> = jest.fn()
const users_removeUsers: jest.SpiedFunction<
  typeof import('../src/github/users.js').removeUsers
> = jest.fn()

jest.unstable_mockModule('../src/github/issues.js', () => {
  return {
    addLabels: issues_addLabels,
    complete: issues_complete,
    generateMessage: issues_generateMessage,
    parse: issues_parse
  }
})
jest.unstable_mockModule('../src/github/repos.js', () => {
  return {
    exists: repos_exists,
    create: repos_create,
    configure: repos_configure,
    generateRepoName: repos_generateRepoName,
    deleteRepositories: repos_deleteRepositories
  }
})
jest.unstable_mockModule('../src/github/teams.js', () => {
  return {
    exists: teams_exists,
    generateTeamName: teams_generateTeamName,
    create: teams_create,
    deleteTeam: teams_deleteTeam,
    addUser: teams_addUser,
    get: teams_get
  }
})
jest.unstable_mockModule('../src/github/users.js', () => {
  return {
    removeUsers: users_removeUsers
  }
})

const actions = await import('../src/actions.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('actions', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  beforeEach(() => {
    core.getInput.mockReturnValue('github-token')
  })

  describe('create()', () => {
    it('Throws if Team Exists', async () => {
      teams_exists.mockResolvedValue(true)
      teams_generateTeamName.mockReturnValue('gh-int-na1')

      try {
        await actions.create(
          {
            action: AllowedIssueAction.CREATE,
            customerName: 'Nick Testing Industries',
            customerAbbr: 'NA1',
            startDate: new Date(2024, 10, 17),
            endDate: new Date(2024, 10, 20),
            attendees: [
              {
                handle: 'ncalteen-testuser',
                email: 'ncalteen+testing@github.com'
              }
            ]
          },
          { issue: { number: 1 } } as any
        )

        jest.runAllTimers()
      } catch (error: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toBe('Team Already Exists: gh-int-na1')
      }
    })

    it('Throws if Repo Exists', async () => {
      teams_exists.mockResolvedValue(false)
      repos_exists.mockResolvedValue(true)
      repos_generateRepoName.mockReturnValue('gh-int-na1-ncalteen-testuser')

      try {
        await actions.create(
          {
            action: AllowedIssueAction.CREATE,
            customerName: 'Nick Testing Industries',
            customerAbbr: 'NA1',
            startDate: new Date(2024, 10, 17),
            endDate: new Date(2024, 10, 20),
            attendees: [
              {
                handle: 'ncalteen-testuser',
                email: 'ncalteen+testing@github.com'
              }
            ]
          },
          { issue: { number: 1 } } as any
        )
      } catch (error: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toBe(
          'Repository Already Exists: gh-int-na1-ncalteen-testuser'
        )
      }
    })

    it('Creates a Class', async () => {
      teams_exists.mockResolvedValue(false)
      teams_create.mockResolvedValue({
        id: 1,
        slug: 'gh-int-na1-ncalteen-testuser'
      })
      repos_exists.mockResolvedValue(false)
      teams_generateTeamName.mockReturnValue('gh-int-na1')
      repos_generateRepoName.mockReturnValue('gh-int-na1-ncalteen-testuser')

      await actions.create(
        {
          action: AllowedIssueAction.CREATE,
          customerName: 'Nick Testing Industries',
          customerAbbr: 'NA1',
          startDate: new Date(2024, 10, 17),
          endDate: new Date(2024, 10, 20),
          attendees: [
            {
              handle: 'ncalteen-testuser',
              email: 'ncalteen+testing@github.com'
            }
          ]
        },
        { issue: { number: 1 } } as any
      )

      expect(teams_create).toHaveBeenCalled()
      expect(repos_create).toHaveBeenCalled()
      expect(issues_addLabels).toHaveBeenCalled()
      expect(issues_complete).toHaveBeenCalled()
    })
  })

  describe('close()', () => {
    it('Closes an Open Class', async () => {
      await actions.close(
        {
          action: AllowedIssueAction.CREATE,
          customerName: 'Nick Testing Industries',
          customerAbbr: 'NA1',
          startDate: new Date(2024, 10, 17),
          endDate: new Date(2024, 10, 20),
          attendees: [
            {
              handle: 'ncalteen-testuser',
              email: 'ncalteen+testing@github.com'
            }
          ]
        },
        { state: 'open', number: 1 } as any
      )

      expect(repos_deleteRepositories).toHaveBeenCalled()
      expect(users_removeUsers).toHaveBeenCalled()
      expect(teams_deleteTeam).toHaveBeenCalled()
    })

    it('Closes a Closed Class', async () => {
      await actions.close(
        {
          action: AllowedIssueAction.CREATE,
          customerName: 'Nick Testing Industries',
          customerAbbr: 'NA1',
          startDate: new Date(2024, 10, 17),
          endDate: new Date(2024, 10, 20),
          attendees: [
            {
              handle: 'ncalteen-testuser',
              email: 'ncalteen+testing@github.com'
            }
          ]
        },
        { state: 'closed', number: 1 } as any
      )

      expect(repos_deleteRepositories).toHaveBeenCalled()
      expect(users_removeUsers).toHaveBeenCalled()
      expect(teams_deleteTeam).toHaveBeenCalled()
      expect(mocktokit.rest.issues.createComment).not.toHaveBeenCalled()
      expect(mocktokit.rest.issues.update).not.toHaveBeenCalled()
    })
  })

  describe('expire()', () => {
    it('Expires an Open Class', async () => {
      mocktokit.paginate.mockResolvedValue([
        {
          state: 'open',
          number: 1
        }
      ])
      issues_parse.mockReturnValue({
        action: AllowedIssueAction.CREATE,
        customerName: 'Nick Testing Industries',
        customerAbbr: 'NA1',
        startDate: new Date(2023, 10, 17),
        endDate: new Date(2023, 10, 20),
        attendees: [
          {
            handle: 'ncalteen-testuser',
            email: 'ncalteen+testing@github.com'
          }
        ]
      })

      await actions.expire()

      expect(repos_deleteRepositories).toHaveBeenCalled()
      expect(users_removeUsers).toHaveBeenCalled()
      expect(teams_deleteTeam).toHaveBeenCalled()
    })
  })

  describe('addUser()', () => {
    it('Throws on Invalid Format', async () => {
      try {
        await actions.addUser(
          {
            action: AllowedIssueAction.CREATE,
            customerName: 'Nick Testing Industries',
            customerAbbr: 'NA1',
            startDate: new Date(2024, 10, 17),
            endDate: new Date(2024, 10, 20),
            attendees: [
              {
                handle: 'ncalteen-testuser',
                email: 'ncalteen+testing@github.com'
              }
            ]
          },
          {
            issue: { number: 1 },
            comment: {
              body: '.add-user invalid format'
            }
          } as any
        )
      } catch (error: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toBe(
          'Invalid Format! Try `.add-user handle,email`'
        )
      }
    })

    it('Adds an User', async () => {
      await actions.addUser(
        {
          action: AllowedIssueAction.CREATE,
          customerName: 'Nick Testing Industries',
          customerAbbr: 'NA1',
          startDate: new Date(2024, 10, 17),
          endDate: new Date(2024, 10, 20),
          attendees: [
            {
              handle: 'ncalteen-testuser',
              email: 'ncalteen+testing@github.com'
            }
          ]
        },
        {
          issue: { number: 1 },
          comment: {
            body: '.add-user ncalteen,ncalteen@github.com'
          }
        } as any
      )

      expect(teams_addUser).toHaveBeenCalled()
      expect(repos_create).toHaveBeenCalled()
      expect(repos_configure).toHaveBeenCalled()
      expect(issues_complete).toHaveBeenCalled()
    })
  })
})
