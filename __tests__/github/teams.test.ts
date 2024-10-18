import { jest } from '@jest/globals'
import * as core from '../../__fixtures__/core.js'
import * as exec from '../../__fixtures__/exec.js'
import * as github from '../../__fixtures__/github.js'
import * as octokit from '../../__fixtures__/octokit.js'
import { AllowedIssueAction } from '../../src/enums.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)
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

const teams = await import('../../src/github/teams.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('teams', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('generateTeamName()', () => {
    it('Generates a Team Name', () => {
      expect(
        teams.generateTeamName({
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
      ).toBe('gh-int-na1')
    })
  })

  describe('create()', () => {
    beforeEach(() => {
      mocktokit.rest.teams.create.mockResolvedValue({
        data: {
          slug: 'gh-int-na1',
          id: 1
        }
      } as any)
    })

    it('Creates a Team', async () => {
      await teams.create({
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

      expect(mocktokit.rest.teams.create).toHaveBeenCalled()
    })
  })

  describe('addUser()', () => {
    it('Adds a User', async () => {
      await teams.addUser(
        {
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
        },
        {
          handle: 'ncalteen-testuser2',
          email: 'ncalteen+testing2@github.com'
        }
      )

      expect(
        mocktokit.rest.teams.addOrUpdateMembershipForUserInOrg
      ).toHaveBeenCalled()
    })
  })

  describe('removeUser()', () => {
    it('Removes a User', async () => {
      await teams.removeUser(
        {
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
        },
        {
          handle: 'ncalteen-testuser',
          email: 'ncalteen+testing@github.com'
        }
      )

      expect(
        mocktokit.rest.teams.removeMembershipForUserInOrg
      ).toHaveBeenCalled()
    })
  })
})
