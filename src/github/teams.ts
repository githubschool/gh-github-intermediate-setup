import * as core from '@actions/core'
import * as github from '@actions/github'
import { Common } from '../enums.js'
import type { ClassRequest, Team, User } from '../types.js'

/**
 * Generates the team name for this class.
 *
 * @param request Class Request
 */
export function generateTeamName(request: ClassRequest): string {
  return `gh-int-${request.customerAbbr.toLowerCase()}`
}

/**
 * Checks if the team exists.
 *
 * @param request Class Request
 * @returns True if Team Exists
 */
export async function exists(request: ClassRequest): Promise<boolean> {
  core.info('Checking if Class Team Exists')

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  try {
    await octokit.rest.teams.getByName({
      org: Common.OWNER,
      team_slug: generateTeamName(request)
    })
  } catch (error: any) {
    core.info(`Error: ${error.status}`)
    if (error.status === 404) return false
  }

  core.info(`Class Team Exists: ${generateTeamName(request)}`)
  return true
}

/**
 * Gets the team.
 *
 * @param request Class Request
 * @returns Team Information
 */
export async function get(request: ClassRequest): Promise<Team> {
  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.teams.getByName({
    org: Common.OWNER,
    team_slug: generateTeamName(request)
  })

  return {
    slug: response.data.slug,
    id: response.data.id
  }
}

/**
 * Creates the team for this class.
 *
 * @param request Class Request
 * @returns Team Information
 */
export async function create(request: ClassRequest): Promise<Team> {
  core.info('Creating Class Team')

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Create the team. Add the class administrators as maintainers.
  const response = await octokit.rest.teams.create({
    org: Common.OWNER,
    name: generateTeamName(request),
    maintainers: request.administrators.map((user) => {
      return user.handle
    })
  })

  // Add the users to the team.
  for (const user of request.attendees) await addUser(request, user, 'member')

  core.info(`Created Class Team: ${generateTeamName(request)}`)
  return { slug: response.data.slug, id: response.data.id }
}

/**
 * Adds a member to the team.
 *
 * @param request Class Request
 * @param user User to Add
 * @param role Role to Assign
 */
export async function addUser(
  request: ClassRequest,
  user: User,
  role: 'member' | 'maintainer' = 'member'
): Promise<void> {
  core.info(`Adding User to Class Team: ${user.handle}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Add the user to the team.
  await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
    org: Common.OWNER,
    team_slug: generateTeamName(request),
    username: user.handle,
    role
  })

  core.info(`Added User to Class Team: ${user.handle}`)
}

/**
 * Removes a member to the team.
 *
 * @param request Class Request
 * @param user User to Remove
 */
export async function removeUser(
  request: ClassRequest,
  user: User
): Promise<void> {
  core.info(`Removing User from Class Team: ${user.handle}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  try {
    // Check if the user is a member (they must have accepted the invitation).
    const membership = await octokit.rest.teams.getMembershipForUserInOrg({
      org: Common.OWNER,
      team_slug: generateTeamName(request),
      username: user.handle
    })

    // Remove the user from the team.
    if (membership.data.state === 'active')
      await octokit.rest.teams.removeMembershipForUserInOrg({
        org: Common.OWNER,
        team_slug: generateTeamName(request),
        username: user.handle
      })
  } catch (error: any) {
    // If the user could not be found, they're not in the organization.
    if (error.status !== 404) throw error
  }

  core.info(`Removed User from Class Team: ${user.handle}`)
}

/**
 * Deletes the team.
 *
 * @param request Class Request
 */
export async function deleteTeam(request: ClassRequest): Promise<void> {
  core.info(`Deleting Team: ${generateTeamName(request)}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // If the team exists, delete it.
  if (await exists(request))
    await octokit.rest.teams.deleteInOrg({
      org: Common.OWNER,
      team_slug: generateTeamName(request)
    })

  core.info(`Deleted Team: ${generateTeamName(request)}`)
}

/**
 * Gets the members of the team.
 *
 * @param request Class Request
 * @returns Team Members
 */
export async function getMembers(request: ClassRequest): Promise<User[]> {
  core.info(`Getting Members of Team: ${generateTeamName(request)}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Get the members of the team.
  const response = await octokit.rest.teams.listMembersInOrg({
    org: Common.OWNER,
    team_slug: generateTeamName(request)
  })

  core.info(`Got Members of Team: ${generateTeamName(request)}`)

  return response.data.map((user) => {
    return { handle: user.login, email: user.email as string }
  })
}
