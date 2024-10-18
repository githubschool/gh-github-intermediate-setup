import { jest } from '@jest/globals'
import * as core from '../../__fixtures__/core.js'
import * as github from '../../__fixtures__/github.js'
import * as octokit from '../../__fixtures__/octokit.js'
import { AllowedIssueAction } from '../../src/enums.js'

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

const teams_getMembers: jest.SpiedFunction<
  typeof import('../../src/github/teams.js').getMembers
> = jest.fn()

jest.unstable_mockModule('../../src/github/teams.js', () => ({
  getMembers: teams_getMembers
}))

const users = await import('../../src/github/users.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('users', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  beforeEach(() => {
    core.getInput.mockReturnValue('token')
  })

  describe('isOrgMember()', () => {
    it('Returns True if User is Org Member', async () => {
      expect(await users.isOrgMember('user')).toBe(true)
    })

    it('Returns False if User is Not Org Member', async () => {
      mocktokit.rest.orgs.getMembershipForUser.mockRejectedValue({
        status: 404
      })

      expect(await users.isOrgMember('user')).toBe(false)
    })
  })

  describe('removeUsers()', () => {
    it('Removes All Users in this class from the organization', async () => {
      mocktokit.graphql.mockResolvedValue({
        user: {
          isEmployee: false,
          email: 'ncalteen@github.com'
        }
      })
      teams_getMembers.mockResolvedValue([
        {
          handle: 'ncalteen',
          email: 'ncalteen@github.com'
        }
      ])

      await users.removeUsers({
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
            email: 'ncalteen+testing@github.com'
          }
        ]
      })

      expect(mocktokit.rest.orgs.removeMember).toHaveBeenCalledWith({
        org: 'githubschool',
        username: 'ncalteen'
      })
    })
  })
})
