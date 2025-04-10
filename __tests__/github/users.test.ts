import { jest } from '@jest/globals'
import * as core from '../../__fixtures__/@actions/core.js'
import * as octokit from '../../__fixtures__/@octokit/rest.js'
import { TEST_CLASSROOM } from '../../__fixtures__/common.js'

jest.unstable_mockModule('@actions/core', () => core)
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

const users = await import('../../src/github/users.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('users', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('isOrgMember()', () => {
    it('Returns false if the user is not an org member', async () => {
      mocktokit.rest.orgs.getMembershipForUser.mockRejectedValue({
        status: 404
      })

      expect(await users.isOrgMember(mocktokit, TEST_CLASSROOM, 'user')).toBe(
        undefined
      )
    })

    it('Returns the user membership status', async () => {
      mocktokit.rest.orgs.getMembershipForUser.mockResolvedValue({
        status: 200,
        data: {
          state: 'active'
        }
      } as any)

      expect(
        await users.isOrgMember(mocktokit, TEST_CLASSROOM, 'user')
      ).toEqual('active')
    })
  })

  describe('removeUsers()', () => {
    it('Removes users from the organization', async () => {
      // Mock the users existing in the organization
      mocktokit.rest.orgs.getMembershipForUser.mockResolvedValue({
        status: 200,
        data: {
          state: 'active'
        }
      } as any)

      await users.removeUsers(mocktokit, TEST_CLASSROOM)

      // Should be called for each user who is not an administrator
      expect(mocktokit.rest.orgs.removeMember).toHaveBeenCalledTimes(2)
    })
  })
})
