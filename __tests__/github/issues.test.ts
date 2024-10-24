import { jest } from '@jest/globals'
import * as core from '../../__fixtures__/core.js'
import * as github from '../../__fixtures__/github.js'
import * as octokit from '../../__fixtures__/octokit.js'
import {
  AllowedIssueAction,
  AllowedIssueCommentAction
} from '../../src/enums.js'

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

const repos_exists: jest.SpiedFunction<
  typeof import('../../src/github/repos.js').exists
> = jest.fn()
const repos_generateRepoName: jest.SpiedFunction<
  typeof import('../../src/github/repos.js').generateRepoName
> = jest.fn()
const teams_exists: jest.SpiedFunction<
  typeof import('../../src/github/teams.js').exists
> = jest.fn()
const teams_generateTeamName: jest.SpiedFunction<
  typeof import('../../src/github/teams.js').generateTeamName
> = jest.fn()
const users_isOrgMember: jest.SpiedFunction<
  typeof import('../../src/github/users.js').isOrgMember
> = jest.fn()

jest.unstable_mockModule('../../src/github/repos.js', () => ({
  exists: repos_exists,
  generateRepoName: repos_generateRepoName
}))
jest.unstable_mockModule('../../src/github/teams.js', () => ({
  exists: teams_exists,
  generateTeamName: teams_generateTeamName
}))
jest.unstable_mockModule('../../src/github/users.js', () => ({
  isOrgMember: users_isOrgMember
}))

const issues = await import('../../src/github/issues.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('issues', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('parse()', () => {
    it('Throws if Body is Missing', async () => {
      try {
        issues.parse(
          {
            number: 3,
            state: 'open',
            title: 'New Form'
          } as any,
          AllowedIssueAction.CREATE
        )
      } catch (e: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e.message).toBe('Issue Body is Empty')
      }
    })

    it('Throws if Administrators are Invalid', async () => {
      try {
        issues.parse(
          {
            body: '### Customer Name\n\nNick Testing Industries\n\n### Customer Abbreviation\n\nNA1\n\n### Start Date\n\n2024-10-17\n\n### End Date\n\n2024-10-20\n\n### Administrators\n\nncalteen\n\n### Attendees\nncalteen-testuser,ncalteen+testing@github.com',
            number: 3,
            state: 'open',
            title: 'New Form'
          } as any,
          AllowedIssueAction.CREATE
        )
      } catch (e: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e.message).toBe(
          "Invalid Administrator: ncalteen (must be 'handle,email' format)"
        )
      }
    })

    it('Throws if Attendees are Invalid', async () => {
      try {
        issues.parse(
          {
            body: '### Customer Name\n\nNick Testing Industries\n\n### Customer Abbreviation\n\nNA1\n\n### Start Date\n\n2024-10-17\n\n### End Date\n\n2024-10-20\n\n### Administrators\n\nncalteen,ncalteen@github.com\n\n### Attendees\nncalteen-testuser',
            number: 3,
            state: 'open',
            title: 'New Form'
          } as any,
          AllowedIssueAction.CREATE
        )
      } catch (e: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e.message).toBe(
          "Invalid Attendee: ncalteen-testuser (must be 'handle,email' format)"
        )
      }
    })

    it('Throws if no Administrators are Provided', async () => {
      try {
        issues.parse(
          {
            body: '### Customer Name\n\nNick Testing Industries\n\n### Customer Abbreviation\n\nNA1\n\n### Start Date\n\n2024-10-17\n\n### End Date\n\n2024-10-20\n\n### Administrators\n\n_No response_\n\n### Attendees\nncalteen-testuser,ncalteen+testing@github.com',
            number: 3,
            state: 'open',
            title: 'New Form'
          } as any,
          AllowedIssueAction.CREATE
        )
      } catch (e: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e.message).toBe('At Least One Administrator Required')
      }
    })

    it('Sets Empty Strings', async () => {
      try {
        issues.parse(
          {
            body: '',
            number: 3,
            state: 'open',
            title: 'New Form'
          } as any,
          AllowedIssueAction.CREATE
        )
      } catch (e: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e.message).toBe(
          "Invalid Administrator:  (must be 'handle,email' format)"
        )
      }
    })

    it('Sets Undefined for No Response', async () => {
      try {
        issues.parse(
          {
            body: '### Customer Name\n\n_no response_\n\n### Customer Abbreviation\n\n_no response_\n\n### Start Date\n\n_no response_\n\n### End Date\n\n_no response_\n\n### Administrators\n\nncalteen,ncalteen@github.com\n\n### Attendees\nncalteen-testuser,ncalteen+testing@github.com',
            number: 3,
            state: 'open',
            title: 'New Form'
          } as any,
          AllowedIssueAction.CREATE
        )
      } catch (e: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e.message).toBe('Customer Name Not Found')
      }
    })

    it('Parses an Issue', async () => {
      expect(
        issues.parse(
          {
            body: '### Customer Name\n\nNick Testing Industries\n\n### Customer Abbreviation\n\nNA1\n\n### Start Date\n\n2024-10-17\n\n### End Date\n\n2024-10-20\n\n### Administrators\n\nncalteen,ncalteen@github.com\n\n### Attendees\nncalteen-testuser,ncalteen+testing@github.com',
            number: 3,
            state: 'open',
            title: 'New Form'
          } as any,
          AllowedIssueAction.CREATE
        )
      ).toMatchObject({
        action: AllowedIssueAction.CREATE,
        customerName: 'Nick Testing Industries',
        customerAbbr: 'NA1',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
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
    })

    it('Parses an Issue without Attendees', async () => {
      expect(
        issues.parse(
          {
            body: '### Customer Name\n\nNick Testing Industries\n\n### Customer Abbreviation\n\nNA1\n\n### Start Date\n\n2024-10-17\n\n### End Date\n\n2024-10-20\n\n### Administrators\n\nncalteen,ncalteen@github.com\n\n### Attendees\n_no response_',
            number: 3,
            state: 'open',
            title: 'New Form'
          } as any,
          AllowedIssueAction.CREATE
        )
      ).toMatchObject({
        action: AllowedIssueAction.CREATE,
        customerName: 'Nick Testing Industries',
        customerAbbr: 'NA1',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        administrators: [
          {
            handle: 'ncalteen',
            email: 'ncalteen@github.com'
          }
        ],
        attendees: []
      })
    })
  })

  describe('complete()', () => {
    beforeEach(() => {
      core.getInput.mockReturnValue('github-token')
    })

    it('Completes an Issue', async () => {
      await issues.complete(
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
          number: 3,
          state: 'open',
          title: 'New Form'
        } as any
      )

      expect(mocktokit.rest.issues.createComment).toHaveBeenCalledWith({
        issue_number: 3,
        owner: 'githubschool',
        repo: 'gh-github-intermediate-issueops',
        body: expect.any(String)
      })
    })
  })

  describe('close()', () => {
    beforeEach(() => {
      core.getInput.mockReturnValue('github-token')
      teams_exists.mockResolvedValue(true)
      repos_exists.mockResolvedValue(true)
      users_isOrgMember.mockResolvedValue('active')
      mocktokit.graphql.mockResolvedValue({
        user: {
          isEmployee: false,
          email: 'noreply@example.com'
        }
      })
    })

    it('Closes an Issue', async () => {
      await issues.close(
        {
          number: 3,
          state: 'open',
          title: 'New Form'
        } as any,
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
        }
      )

      expect(mocktokit.rest.issues.createComment).toHaveBeenCalledWith({
        issue_number: 3,
        owner: 'githubschool',
        repo: 'gh-github-intermediate-issueops',
        body: expect.any(String)
      })
      expect(mocktokit.rest.issues.update).toHaveBeenCalledWith({
        issue_number: 3,
        owner: 'githubschool',
        repo: 'gh-github-intermediate-issueops',
        state: 'closed',
        state_reason: 'completed'
      })
    })

    it('Does Not Close a Closed Issue', async () => {
      await issues.close(
        {
          number: 3,
          state: 'closed',
          title: 'New Form'
        } as any,
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
        }
      )

      expect(mocktokit.rest.issues.createComment).not.toHaveBeenCalled()
      expect(mocktokit.rest.issues.update).not.toHaveBeenCalled()
    })
  })

  describe('generateMessage()', () => {
    it('Generates an Add Admin Message', () => {
      github.context.payload.comment.body =
        '.add-admin ncalteen,ncalteen@github.com'

      expect(
        typeof issues.generateMessage({
          action: AllowedIssueCommentAction.ADD_ADMIN,
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
      ).toBe('string')
    })

    it('Generates an Add User Message', () => {
      github.context.payload.comment.body =
        '.add-user ncalteen,ncalteen@github.com'

      expect(
        typeof issues.generateMessage({
          action: AllowedIssueCommentAction.ADD_USER,
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
      ).toBe('string')
    })

    it('Generates a Close Message', () => {
      expect(
        typeof issues.generateMessage({
          action: AllowedIssueAction.CLOSE,
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
      ).toBe('string')
    })

    it('Generates a Create Message', () => {
      expect(
        typeof issues.generateMessage({
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
      ).toBe('string')
    })

    it('Generates a Remove Admin Message', () => {
      github.context.payload.comment.body =
        '.remove-admin ncalteen,ncalteen@github.com'

      expect(
        typeof issues.generateMessage({
          action: AllowedIssueCommentAction.REMOVE_ADMIN,
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
      ).toBe('string')
    })

    it('Generates a Remove User Message', () => {
      github.context.payload.comment.body =
        '.remove-user ncalteen,ncalteen@github.com'

      expect(
        typeof issues.generateMessage({
          action: AllowedIssueCommentAction.REMOVE_USER,
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
      ).toBe('string')
    })

    it('Throws on Invalid Action', () => {
      try {
        issues.generateMessage({
          action: 'invalid' as AllowedIssueAction,
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
      } catch (e: any) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e.message).toBe('Invalid Action: invalid')
      }
    })
  })
})
