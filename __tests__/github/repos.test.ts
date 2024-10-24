import { jest } from '@jest/globals'
import * as core from '../../__fixtures__/core.js'
import * as exec from '../../__fixtures__/exec.js'
import * as fs from '../../__fixtures__/fs.js'
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
jest.unstable_mockModule('fs', () => fs)

const teams_getMembers: jest.SpiedFunction<
  typeof import('../../src/github/teams.js').getMembers
> = jest.fn()

jest.unstable_mockModule('../../src/github/teams.js', () => ({
  getMembers: teams_getMembers
}))

const repos = await import('../../src/github/repos.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('repos', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('generateRepoName()', () => {
    it('Generates a Repo Name', () => {
      expect(
        repos.generateRepoName(
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
      ).toBe('gh-int-na1-ncalteen-testuser')
    })
  })

  describe('create()', () => {
    beforeEach(() => {
      core.getInput.mockReturnValue('github-token')
      mocktokit.rest.repos.createUsingTemplate.mockResolvedValue({
        data: {
          name: 'repo-name'
        }
      } as any)
    })

    it('Creates a Repo', async () => {
      await repos.create(
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
        },
        {
          id: 1234,
          slug: 'team-name'
        }
      )

      expect(mocktokit.rest.repos.createUsingTemplate).toHaveBeenCalled()
      expect(
        mocktokit.rest.teams.addOrUpdateRepoPermissionsInOrg
      ).toHaveBeenCalled()
    })
  })

  describe('exists()', () => {
    beforeEach(() => {
      core.getInput.mockReturnValue('github-token')
    })

    it('Returns True if a Repo Exists', async () => {
      expect(
        await repos.exists(
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
      ).toBe(true)
    })

    it('Returns False if a Repo Does Not Exist', async () => {
      mocktokit.rest.repos.get.mockRejectedValue({
        status: 404
      })

      expect(
        await repos.exists(
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
      ).toBe(false)
    })
  })

  describe('configure()', () => {
    beforeEach(() => {
      core.getInput
        .mockReturnValueOnce('workspace')
        .mockReturnValueOnce('github-token')

      mocktokit.rest.repos.createPagesSite.mockResolvedValue({
        data: {
          html_url: 'pages-url'
        }
      } as any)
    })

    it('Configures a Repo', async () => {
      await repos.configure(
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
        },
        'gh-int-na1-ncalteen-testuser',
        {
          id: 1234,
          slug: 'team-name'
        }
      )

      expect(mocktokit.rest.repos.createOrUpdateEnvironment).toHaveBeenCalled()
      expect(mocktokit.rest.repos.createPagesSite).toHaveBeenCalled()
      expect(mocktokit.rest.repos.update).toHaveBeenCalled()
    })
  })
})
