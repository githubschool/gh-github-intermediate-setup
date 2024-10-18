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

  beforeEach(() => {
    core.getInput.mockReturnValue('github-token')
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

  describe('exists()', () => {
    it('Returns True if a Team Exists', async () => {
      expect(
        await teams.exists({
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
      ).toBe(true)
    })

    it('Returns False if a Team Does Not Exist', async () => {
      mocktokit.rest.teams.getByName.mockRejectedValue({
        status: 404
      } as any)

      expect(
        await teams.exists({
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
      ).toBe(false)
    })
  })

  describe('get()', () => {
    it('Gets a Team', async () => {
      mocktokit.rest.teams.getByName.mockResolvedValue({
        data: {
          slug: 'gh-int-na1',
          id: 1
        }
      } as any)

      expect(
        await teams.get({
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
      ).toMatchObject({
        slug: 'gh-int-na1',
        id: 1
      })
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
      expect(
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
      ).toMatchObject({
        slug: 'gh-int-na1',
        id: 1
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

  describe('deleteTeam()', () => {
    it('Deletes a Team', async () => {
      await teams.deleteTeam({
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

      expect(mocktokit.rest.teams.deleteInOrg).toHaveBeenCalled()
    })
  })

  describe('getMembers()', () => {
    it('Gets Members', async () => {
      mocktokit.rest.teams.listMembersInOrg.mockResolvedValue({
        data: [
          {
            login: 'ncalteen',
            email: 'ncalteen@github.com'
          }
        ]
      } as any)

      expect(
        await teams.getMembers({
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
      ).toMatchObject([
        {
          handle: 'ncalteen',
          email: 'ncalteen@github.com'
        }
      ])

      expect(mocktokit.rest.teams.listMembersInOrg).toHaveBeenCalled()
    })
  })
})
