import { jest } from '@jest/globals'
import * as core from '../../__fixtures__/@actions/core.js'
import * as exec from '../../__fixtures__/@actions/exec.js'
import * as octokit from '../../__fixtures__/@octokit/rest.js'
import { TEST_CLASSROOM } from '../../__fixtures__/common.js'
import * as fs from '../../__fixtures__/fs.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)
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

const generateTeamName: jest.SpiedFunction<
  typeof import('../../src/github/teams.js').generateTeamName
> = jest.fn()
const getMembers: jest.SpiedFunction<
  typeof import('../../src/github/teams.js').getMembers
> = jest.fn()

jest.unstable_mockModule('../../src/github/teams.js', () => ({
  generateTeamName,
  getMembers
}))

const repos = await import('../../src/github/repos.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

describe('repos', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('generateRepoName()', () => {
    it('Generates a repo name', () => {
      expect(
        repos.generateRepoName(TEST_CLASSROOM, 'ncalteen-testuser')
      ).toEqual('gh-int-tc-ncalteen-testuser')
    })
  })

  describe('create()', () => {
    beforeEach(() => {
      mocktokit.rest.repos.createUsingTemplate.mockResolvedValue({
        data: {
          name: 'repo-name'
        }
      } as any)
    })

    it('Creates a repo', async () => {
      await repos.create(mocktokit, TEST_CLASSROOM, 'ncalteen-testuser')

      expect(mocktokit.rest.repos.createUsingTemplate).toHaveBeenCalled()
      expect(
        mocktokit.rest.teams.addOrUpdateRepoPermissionsInOrg
      ).toHaveBeenCalled()
    })
  })

  describe('exists()', () => {
    it('Returns true if a repo exists', async () => {
      mocktokit.rest.repos.get.mockResolvedValue({
        data: {
          name: 'repo-name'
        }
      } as any)

      expect(
        await repos.exists(mocktokit, TEST_CLASSROOM, 'ncalteen-testuser')
      ).toBe(true)
    })

    it('Returns false if a repo does not exist', async () => {
      mocktokit.rest.repos.get.mockRejectedValue({
        status: 404
      })

      expect(
        await repos.exists(mocktokit, TEST_CLASSROOM, 'ncalteen-testuser')
      ).toBe(false)
    })
  })

  describe('configure()', () => {
    beforeEach(() => {
      mocktokit.rest.repos.createPagesSite.mockResolvedValue({
        data: {
          html_url: 'pages-url'
        }
      } as any)
    })

    it('Configures a repo', async () => {
      exec.getExecOutput.mockResolvedValue({
        stdout: 'stdout',
        stderr: 'stderr',
        exitCode: 0
      } as never)

      await repos.configure(mocktokit, TEST_CLASSROOM, 'ncalteen-testuser')

      expect(mocktokit.rest.repos.createOrUpdateEnvironment).toHaveBeenCalled()
      expect(mocktokit.rest.repos.createPagesSite).toHaveBeenCalled()
      expect(mocktokit.rest.repos.update).toHaveBeenCalled()
    })
  })

  describe('deleteRepositories()', () => {
    it('Deletes all class repositories', async () => {
      mocktokit.rest.search.repos.mockResolvedValue({
        data: {
          items: [{ name: 'repo-1' }, { name: 'repo-2' }]
        }
      } as any)

      await repos.deleteRepositories(mocktokit, TEST_CLASSROOM)

      expect(mocktokit.rest.search.repos).toHaveBeenCalledWith({
        q: `org:${TEST_CLASSROOM.organization} gh-int-${TEST_CLASSROOM.customerAbbr.toLowerCase()}-`
      })
      expect(mocktokit.rest.repos.delete).toHaveBeenCalledTimes(2)
      expect(mocktokit.rest.repos.delete).toHaveBeenCalledWith({
        owner: TEST_CLASSROOM.organization,
        repo: 'repo-1'
      })
      expect(mocktokit.rest.repos.delete).toHaveBeenCalledWith({
        owner: TEST_CLASSROOM.organization,
        repo: 'repo-2'
      })
    })

    it('Handles no repositories found gracefully', async () => {
      mocktokit.rest.search.repos.mockResolvedValue({
        data: {
          items: []
        }
      } as any)

      await repos.deleteRepositories(mocktokit, TEST_CLASSROOM)

      expect(mocktokit.rest.search.repos).toHaveBeenCalledWith({
        q: `org:${TEST_CLASSROOM.organization} gh-int-${TEST_CLASSROOM.customerAbbr.toLowerCase()}-`
      })
      expect(mocktokit.rest.repos.delete).not.toHaveBeenCalled()
    })
  })
})
