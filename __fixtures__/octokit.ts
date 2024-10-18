import { jest } from '@jest/globals'
import { Endpoints } from '@octokit/types'

export const graphql = jest.fn()
export const paginate = jest.fn()
export const rest = {
  issues: {
    addLabels: jest.fn(),
    createComment: jest.fn(),
    get: jest.fn<
      () => Promise<
        Endpoints['GET /repos/{owner}/{repo}/issues/{issue_number}']['response']
      >
    >(),
    listComments: jest.fn(),
    removeLabel: jest.fn(),
    update: jest.fn()
  },
  orgs: {
    checkMembershipForUser: jest.fn(),
    createOrUpdateCustomPropertiesValuesForRepos: jest.fn()
  },
  pulls: {
    create:
      jest.fn<
        () => Promise<Endpoints['POST /repos/{owner}/{repo}/pulls']['response']>
      >(),
    listFiles: jest.fn()
  },
  repos: {
    createOrUpdateEnvironment: jest.fn(),
    createPagesSite: jest.fn(),
    createUsingTemplate: jest.fn(),
    get: jest.fn<
      () => Promise<Endpoints['GET /repos/{owner}/{repo}']['response']>
    >(),
    getContent: jest.fn(),
    update: jest.fn()
  },
  teams: {
    addOrUpdateMembershipForUserInOrg: jest.fn(),
    addOrUpdateRepoPermissionsInOrg: jest.fn(),
    create: jest.fn(),
    removeMembershipForUserInOrg: jest.fn()
  }
}
