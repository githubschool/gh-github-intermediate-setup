import * as core from '@actions/core'
import * as github from '@actions/github'
import { Common } from '../enums.js'
import { ClassRequest, Team, User } from '../types.js'

/**
 * Generates the team name for this class.
 *
 * @param request The class request
 */
export function generateTeamName(request: ClassRequest): string {
  return `gh-int-${request.customerAbbr.toLowerCase()}`
}

/**
 * Creates the team for this class.
 *
 * @param request The class request
 * @returns The team slug
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
 * @param request The class request
 * @param user The user to add
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
 * Removes a member from the team.
 *
 * @param request The class request
 * @param user The user to add
 */
export async function removeUser(
  request: ClassRequest,
  user: User
): Promise<void> {
  core.info(`Removing User from Class Team: ${user.handle}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Add the user to the team.
  await octokit.rest.teams.removeMembershipForUserInOrg({
    org: Common.OWNER,
    team_slug: generateTeamName(request),
    username: user.handle
  })

  core.info(`Removed User from Class Team: ${user.handle}`)
}
