import * as core from '@actions/core'
import * as github from '@actions/github'
import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types'
import { Common } from './enums.js'
import * as issues from './github/issues.js'
import * as repos from './github/repos.js'
import * as teams from './github/teams.js'
import * as users from './github/users.js'
import type { ClassRequest } from './types.js'

/**
 * Creates a class from a request.
 *
 * @param request Class Request
 * @param payload Issue Payload
 */
export async function create(
  request: ClassRequest,
  payload: IssuesEvent
): Promise<void> {
  core.info(`Creating Class Request: #${payload.issue.number}`)

  // Check if the team already exists.
  if (await teams.exists(request))
    throw new Error(`Team Already Exists: ${teams.generateTeamName(request)}`)

  // Check if any user repositories already exist.
  for (const user of request.attendees)
    if (await repos.exists(request, user))
      throw new Error(
        `Repository Already Exists: ${repos.generateRepoName(request, user)}`
      )

  // Create the team and add the users.
  const team = await teams.create(request)

  // Create and configure the user repositories.
  for (const user of request.attendees) {
    const repo = await repos.create(request, user, team)
    await repos.configure(request, user, repo, team)
  }

  // Comment on the issue with the summary.
  await issues.complete(request, payload.issue)

  core.info(`Created Class Request: #${payload.issue.number}`)
}

/**
 * Closes a class.
 *
 * @param request Class Request
 * @param payload Issue Payload
 */
export async function close(
  request: ClassRequest,
  payload: IssuesEvent
): Promise<void> {
  core.info(`Closing Class Request: #${payload.issue.number}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Delete user repositories.
  await repos.deleteRepositories(request)

  // Remove users from the organization.
  await users.removeUsers(request)

  // Delete the team.
  await teams.deleteTeam(request)

  // Check if the issue is open.
  if (payload.issue.state === 'open') {
    // Add the closed comment to the request issue.
    await octokit.rest.issues.createComment({
      issue_number: payload.issue.number,
      owner: Common.OWNER,
      repo: Common.ISSUEOPS_REPO,
      body: issues.generateMessage(request)
    })

    // Close the issue.
    await octokit.rest.issues.update({
      owner: Common.OWNER,
      repo: Common.ISSUEOPS_REPO,
      issue_number: payload.issue.number,
      state: 'closed',
      state_reason: 'completed'
    })
  }

  // Comment on the issue with the summary.
  await issues.complete(request, payload.issue)

  core.info(`Closed Class Request: #${payload.issue.number}`)
}

/**
 * Adds an administrator to a class.
 *
 * @param request Class Request
 * @param payload Issue Comment Payload
 */
export async function addAdmin(
  request: ClassRequest,
  payload: IssueCommentEvent
): Promise<void> {
  core.info(`Adding Admin to Class Request: #${payload.issue.number}`)

  // Get the user from the comment body.
  // Format: .add-admin handle,email
  if (
    !payload.comment.body.split(' ')[1] ||
    !payload.comment.body.split(' ')[1].includes(',') ||
    payload.comment.body.split(' ')[1].split(',').length !== 2
  )
    throw new Error('Invalid Format! Try `.add-admin handle,email`')

  const user = {
    handle: payload.comment.body.split(' ')[1].split(',')[0],
    email: payload.comment.body.split(' ')[1].split(',')[1]
  }

  await teams.addUser(request, user, 'maintainer')

  // Comment on the issue with the summary.
  await issues.complete(request, payload.issue)

  core.info(`Added Admin to Class Request: #${payload.issue.number}`)
}

/**
 * Adds an user to a class.
 *
 * @param request Class Request
 * @param payload Issue Comment Payload
 */
export async function addUser(
  request: ClassRequest,
  payload: IssueCommentEvent
): Promise<void> {
  core.info(`Adding User to Class Request: #${payload.issue.number}`)

  // Get the user from the comment body.
  // Format: .add-user handle,email
  if (
    !payload.comment.body.split(' ')[1] ||
    !payload.comment.body.split(' ')[1].includes(',') ||
    payload.comment.body.split(' ')[1].split(',').length !== 2
  )
    throw new Error('Invalid Format! Try `.add-user handle,email`')

  const user = {
    handle: payload.comment.body.split(' ')[1].split(',')[0],
    email: payload.comment.body.split(' ')[1].split(',')[1]
  }

  const team = await teams.get(request)

  // Add the user to the team.
  await teams.addUser(request, user)

  // Create and configure their repository.
  const repo = await repos.create(request, user, team)
  await repos.configure(request, user, repo, team)

  // Comment on the issue with the summary.
  await issues.complete(request, payload.issue)

  core.info(`Added User to Class Request: #${payload.issue.number}`)
}

/**
 * Removes an administrator from the class.
 *
 * @param request Class Request
 * @param payload Issue Comment
 */
export async function removeAdmin(
  request: ClassRequest,
  payload: IssueCommentEvent
): Promise<void> {
  core.info(`Removing Admin from Class Request: #${payload.issue.number}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Get the user from the comment body.
  // Format: .remove-admin handle,email
  if (
    !payload.comment.body.split(' ')[1] ||
    !payload.comment.body.split(' ')[1].includes(',') ||
    payload.comment.body.split(' ')[1].split(',').length !== 2
  )
    throw new Error('Invalid Format! Try `.remove-admin handle,email`')

  const user = {
    handle: payload.comment.body.split(' ')[1].split(',')[0],
    email: payload.comment.body.split(' ')[1].split(',')[1]
  }

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
      { login: user.handle }
    )

  // Remove the user from the organization (if they're not a GitHub or Microsoft
  // employee). This will also remove them from the team.
  if (
    !response.user.isEmployee &&
    !response.user.email.includes('@microsoft.com') &&
    (await users.isOrgMember(user.handle))
  )
    await octokit.rest.orgs.removeMember({
      org: Common.OWNER,
      username: user.handle
    })

  await issues.complete(request, payload.issue)

  core.info(`Removed Admin from Class Request: #${payload.issue.number}`)
}

/**
 * Removes a user from the class.
 *
 * @param request Class Request
 * @param payload Issue Comment Payload
 */
export async function removeUser(
  request: ClassRequest,
  payload: IssueCommentEvent
): Promise<void> {
  core.info(`Removing User from Class Request: #${payload.issue.number}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Get the user from the comment body.
  // Format: .remove-admin handle,email
  if (
    !payload.comment.body.split(' ')[1] ||
    !payload.comment.body.split(' ')[1].includes(',') ||
    payload.comment.body.split(' ')[1].split(',').length !== 2
  )
    throw new Error('Invalid Format! Try `.remove-admin handle,email`')

  const user = {
    handle: payload.comment.body.split(' ')[1].split(',')[0],
    email: payload.comment.body.split(' ')[1].split(',')[1]
  }

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
      { login: user.handle }
    )

  // Remove the user from the organization (if they're not a GitHub or
  // Microsoft employee). This will also remove them from the team.
  if (
    !response.user.isEmployee &&
    !response.user.email.includes('@microsoft.com') &&
    (await users.isOrgMember(user.handle))
  )
    await octokit.rest.orgs.removeMember({
      org: Common.OWNER,
      username: user.handle
    })

  // Delete the user repository.
  if (await repos.exists(request, user))
    await octokit.rest.repos.delete({
      owner: Common.OWNER,
      repo: repos.generateRepoName(request, user)
    })

  await issues.complete(request, payload.issue)

  core.info(`Removed User from Class Request: #${payload.issue.number}`)
}
