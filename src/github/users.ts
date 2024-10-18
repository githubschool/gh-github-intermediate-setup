import * as core from '@actions/core'
import * as github from '@actions/github'
import { Common } from '../enums.js'
import type { ClassRequest } from '../types.js'
import * as teams from './teams.js'

/**
 * Checks if the user is a member of the organization.
 *
 * @param handle User Handle
 * @returns True if User is Member
 */
export async function isOrgMember(handle: string): Promise<boolean> {
  core.info(`Checking if User is Org Member: ${handle}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  try {
    await octokit.rest.orgs.getMembershipForUser({
      org: Common.OWNER,
      username: handle
    })
  } catch (error: any) {
    core.info(`Error: ${error.status}`)
    if (error.status === 404) return false
  }

  core.info(`User is Org Member: ${handle}`)
  return true
}

/**
 * Removes all users in this class from the organization.
 *
 * @param request Class Request
 */
export async function removeUsers(request: ClassRequest): Promise<void> {
  core.info(`Removing Users from the Organization: ${Common.OWNER}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Get the team members.
  const members = await teams.getMembers(request)

  for (const member of members) {
    core.info(`Removing User: ${member.handle}`)

    // Check if the user is a GitHub/Microsoft employee.
    const response: { user: { isEmployee: boolean; email: string } } =
      await octokit.graphql(
        `
        query($login: String!) {
          user(login: $login) {
            isEmployee
            email
          }
        }
        `,
        { login: member.handle }
      )

    // Remove the user from the organization (if they're not a GitHub or
    // Microsoft employee).
    if (
      !response.user.isEmployee &&
      !response.user.email.includes('@microsoft.com') &&
      (await isOrgMember(member.handle))
    )
      await octokit.rest.orgs.removeMember({
        org: Common.OWNER,
        username: member.handle
      })
  }

  core.info(`Removed Users from the Organization: ${Common.OWNER}`)
}
