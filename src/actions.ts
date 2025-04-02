import * as core from '@actions/core'
import * as github from '@actions/github'
import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types'
import { AllowedIssueAction, Common } from './enums.js'
import * as issues from './github/issues.js'
import * as repos from './github/repos.js'
import * as teams from './github/teams.js'
import * as users from './github/users.js'
import type { ClassRequest } from './types.js'

/**
 * Creates a class from a request.
 *
 * @param request Class Request
 * @param issue Issue Payload
 */
export async function create(
  request: ClassRequest,
  issue: IssuesEvent['issue']
): Promise<void> {
  core.info(`Creating Class Request: #${issue.number}`)

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
  request.team = team.slug

  // Create and configure the user repositories.
  for (const user of request.attendees) {
    const repo = await repos.create(request, user, team)

    // Sleep 5s to wait for the repo to be created and initial commit pushed.
    if (process.env.NODE_ENV !== 'test')
      await new Promise((resolve) => setTimeout(resolve, 5000))

    await repos.configure(request, user, repo, team)
  }

  // Add the provisioned label.
  await issues.addLabels(issue, ['provisioned'])

  // Comment on the issue with the summary.
  await issues.complete(request, issue)

  core.info(`Created Class Request: #${issue.number}`)
}

/**
 * Closes a class.
 *
 * @param request Class Request
 * @param issue Issue Payload
 */
export async function close(
  request: ClassRequest,
  issue: IssuesEvent['issue']
): Promise<void> {
  core.info(`Closing Class Request: #${issue.number}`)

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
  if (issue.state === 'open') {
    // Add the closed comment to the request issue.
    await octokit.rest.issues.createComment({
      issue_number: issue.number,
      owner: Common.OWNER,
      repo: Common.ISSUEOPS_REPO,
      body: issues.generateMessage(request)
    })

    // Close the issue.
    await octokit.rest.issues.update({
      owner: Common.OWNER,
      repo: Common.ISSUEOPS_REPO,
      issue_number: issue.number,
      state: 'closed',
      state_reason: 'completed'
    })
  }

  // Comment on the issue with the summary.
  await issues.complete(request, issue)

  core.info(`Closed Class Request: #${issue.number}`)
}

/**
 * Expires any open classes.
 */
export async function expire(): Promise<void> {
  core.info('Expiring Open Classes')

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Get the list of open issues.
  const response = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner: Common.OWNER,
    repo: Common.ISSUEOPS_REPO,
    state: 'open',
    labels: 'gh-intermediate-class'
  })

  // Parse each issue.
  for (const issue of response) {
    const request = issues.parse(
      issue as IssuesEvent['issue'],
      AllowedIssueAction.EXPIRE
    )

    // If the end date has passed, close the request.
    if (request.endDate < new Date()) {
      await close(request, issue as IssuesEvent['issue'])
    }
  }

  core.info('Expired Open Classes')
}

/**
 * Adds a user to a class.
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

  // Sleep 5s to wait for the repo to be created and initial commit pushed.
  if (process.env.NODE_ENV !== 'test')
    await new Promise((resolve) => setTimeout(resolve, 5000))

  await repos.configure(request, user, repo, team)

  // Comment on the issue with the summary.
  await issues.complete(request, payload.issue)

  core.info(`Added User to Class Request: #${payload.issue.number}`)
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
  // Format: .remove-user handle,email
  if (
    !payload.comment.body.split(' ')[1] ||
    !payload.comment.body.split(' ')[1].includes(',') ||
    payload.comment.body.split(' ')[1].split(',').length !== 2
  )
    throw new Error('Invalid Format! Try `.remove-user handle,email`')

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

  // Get the user's membership state.
  const memberState = await users.isOrgMember(user.handle)

  // Remove the user from the organization (if they're not a GitHub or Microsoft
  // employee, and are not in the instructors file). This will also remove them
  // from the team.
  if (
    !response.user.isEmployee &&
    !response.user.email.includes('@microsoft.com') &&
    memberState === 'active' &&
    !users.isInstructor(user.handle)
  )
    await octokit.rest.orgs.removeMember({
      org: Common.OWNER,
      username: user.handle
    })

  // If the membership is still pending, cancel the invitation.
  if (
    !response.user.isEmployee &&
    !response.user.email.includes('@microsoft.com') &&
    memberState === 'pending' &&
    !users.isInstructor(user.handle)
  ) {
    // Get the invitation ID.
    const invitations = await octokit.paginate(
      octokit.rest.orgs.listPendingInvitations,
      {
        org: Common.OWNER
      }
    )

    for (const invitation of invitations) {
      if (invitation.login === user.handle) {
        // Cancel the invitation.
        await octokit.rest.orgs.cancelInvitation({
          org: Common.OWNER,
          invitation_id: invitation.id
        })
      }
    }
  }

  // Delete the user repository. This should happen regardless of whether the
  // user is an employee or instructor.
  if (await repos.exists(request, user))
    await octokit.rest.repos.delete({
      owner: Common.OWNER,
      repo: repos.generateRepoName(request, user)
    })

  // Remove from the team. This should happen regardless of whether the user is
  // an employee or instructor.
  await teams.removeUser(request, user)

  await issues.complete(request, payload.issue)

  core.info(`Removed User from Class Request: #${payload.issue.number}`)
}
