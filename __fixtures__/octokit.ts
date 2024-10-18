import { jest } from '@jest/globals'

export const graphql = jest.fn()
export const paginate = jest.fn()
export const rest = {
  issues: {
    addLabels: jest.fn(),
    createComment: jest.fn(),
    get: jest.fn(),
    listComments: jest.fn(),
    removeLabel: jest.fn(),
    update: jest.fn()
  },
  orgs: {
    checkMembershipForUser: jest.fn(),
    createOrUpdateCustomPropertiesValuesForRepos: jest.fn(),
    getMembershipForUser: jest.fn(),
    removeMember: jest.fn()
  },
  pulls: {
    create: jest.fn(),
    listFiles: jest.fn()
  },
  repos: {
    createOrUpdateEnvironment: jest.fn(),
    createPagesSite: jest.fn(),
    createUsingTemplate: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    getContent: jest.fn(),
    update: jest.fn()
  },
  teams: {
    addOrUpdateMembershipForUserInOrg: jest.fn(),
    addOrUpdateRepoPermissionsInOrg: jest.fn(),
    create: jest.fn(),
    deleteInOrg: jest.fn(),
    getByName: jest.fn(),
    listMembersInOrg: jest.fn(),
    removeMembershipForUserInOrg: jest.fn()
  }
}
