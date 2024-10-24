import * as core from '@actions/core'
import * as github from '@actions/github'
import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types'
import { dedent } from 'ts-dedent'
import {
  AllowedIssueAction,
  AllowedIssueCommentAction,
  Common
} from '../enums.js'
import type { ClassRequest, User } from '../types.js'
import * as repos from './repos.js'
import * as teams from './teams.js'
import * as users from './users.js'

/**
 * Parses the issue body and returns a JSON object.
 *
 * @param issue Issue
 * @param action Action
 * @returns Class Request
 */
export function parse(
  issue: IssueCommentEvent['issue'] | IssuesEvent['issue'],
  action: AllowedIssueAction | AllowedIssueCommentAction
): ClassRequest {
  core.info(`Parsing Class Request: #${issue.number}`)

  const noResponse: string = '_No response_'

  const regexes: { [k: string]: RegExp } = {
    customerName: /### Customer Name[\r\n]+(?<customerName>[\s\S]*?)(?=###|$)/,
    customerAbbr:
      /### Customer Abbreviation[\r\n]+(?<customerAbbr>[\s\S]*?)(?=###|$)/,
    startDate: /### Start Date[\r\n]+(?<startDate>[\s\S]*?)(?=###|$)/,
    endDate: /### End Date[\r\n]+(?<endDate>[\s\S]*?)(?=###|$)/,
    administrators:
      /### Administrators[\r\n]+(?<administrators>[\s\S]*?)(?=###|$)/,
    attendees: /### Attendees[\r\n]+(?<attendees>[\s\S]*?)(?=###|$)/
  }

  // Get the PR body and check that it isn't empty
  const body = issue.body
  if (body === null || body === undefined)
    throw new Error('Issue Body is Empty')

  core.info('Class Request Properties')
  const results: { [k: string]: string } = {
    customerName:
      body.match(regexes.customerName)?.groups?.customerName.trim() ?? '',
    customerAbbr:
      body
        .match(regexes.customerAbbr)
        ?.groups?.customerAbbr.trim()
        .toUpperCase() ?? '',
    startDate: body.match(regexes.startDate)?.groups?.startDate.trim() ?? '',
    endDate: body.match(regexes.endDate)?.groups?.endDate.trim() ?? '',
    administrators:
      body
        .match(regexes.administrators)
        ?.groups?.administrators.trim()
        .toLowerCase() ?? '',
    attendees:
      body.match(regexes.attendees)?.groups?.attendees.trim().toLowerCase() ??
      ''
  }
  core.info(JSON.stringify(results, null, 2))

  // Parse the customer name, default to empty string.
  const customerName: string | undefined = results.customerName.includes(
    noResponse.toLowerCase()
  )
    ? undefined
    : results.customerName

  // Parse the customer abbreviation, default to empty string.
  const customerAbbr: string | undefined = results.customerAbbr.includes(
    noResponse.toLowerCase()
  )
    ? undefined
    : results.customerAbbr

  // Parse the start date.
  const startDate: Date | undefined = isNaN(Date.parse(results.startDate))
    ? undefined
    : new Date(Date.parse(results.startDate))

  // Parse the end date.
  const endDate: Date | undefined = isNaN(Date.parse(results.endDate))
    ? undefined
    : new Date(Date.parse(results.endDate))

  // Parse the administrators, default to empty array.
  const administrators: User[] = results.administrators.includes(
    noResponse.toLowerCase()
  )
    ? []
    : results.administrators.split(/\n/).map((value: string) => {
        if (value.split(/,\s?/).length !== 2)
          throw new Error(
            `Invalid Administrator: ${value} (must be 'handle,email' format)`
          )

        return {
          email: value.split(/,\s?/)[1],
          handle: value.split(/,\s?/)[0]
        }
      })

  // Parse the attendees, default to empty array.
  const attendees: User[] = results.attendees.includes(noResponse.toLowerCase())
    ? []
    : results.attendees.split(/\n/).map((value: string) => {
        if (value.split(/,\s?/).length !== 2)
          throw new Error(
            `Invalid Attendee: ${value} (must be 'handle,email' format)`
          )

        return {
          email: value.split(/,\s?/)[1],
          handle: value.split(/,\s?/)[0]
        }
      })

  // Validate the parsed inputs...
  core.info('Validating Request Properties')
  if (!customerName) throw new Error('Customer Name Not Found')
  if (!customerAbbr) throw new Error('Customer Abbreviation Not Found')
  if (!startDate) throw new Error('Start Date Not Found')
  if (!endDate) throw new Error('End Date Not Found')

  // At least one admin is required, but attendees can be empty
  if (administrators.length === 0)
    throw new Error('At Least One Administrator Required')

  core.info('Creating Class Request')
  const request: ClassRequest = {
    action,
    customerName,
    customerAbbr,
    startDate,
    endDate,
    administrators,
    attendees
  }

  core.info(JSON.stringify(request, null, 2))

  return request
}

/**
 * Completes the class request.
 *
 * @param issue Issue
 * @param request Class Request
 */
export async function complete(
  request: ClassRequest,
  issue: IssueCommentEvent['issue'] | IssuesEvent['issue']
): Promise<void> {
  core.info(`Completing Class Request: #${issue.number}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Add the success comment to the request issue.
  await octokit.rest.issues.createComment({
    issue_number: issue.number,
    owner: Common.OWNER,
    repo: Common.ISSUEOPS_REPO,
    body: generateMessage(request)
  })

  core.info(`Completed Class Request: #${issue.number}`)
}

/**
 * Closes a request.
 *
 * @param issue Issue
 * @param request Class Request
 */
export async function close(
  issue: IssueCommentEvent['issue'],
  request: ClassRequest
): Promise<void> {
  core.info(`Closing Class Request: #${issue.number}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // If the team exists, delete it.
  if (await teams.exists(request))
    await octokit.rest.teams.deleteInOrg({
      org: Common.OWNER,
      team_slug: teams.generateTeamName(request)
    })

  for (const user of request.attendees) {
    // If the repositories exist, delete them.
    if (await repos.exists(request, user))
      await octokit.rest.repos.delete({
        owner: Common.OWNER,
        repo: repos.generateRepoName(request, user)
      })

    // Remove the user from the organization (if they're not a GitHub or
    // Microsoft employee).
    const response = (await octokit.graphql(
      `
      query($login: String!) {
        user(login: $login) {
          isEmployee
          email
        }
      }
      `,
      { login: user.handle }
    )) as any

    // Get the user's membership state.
    const memberState = await users.isOrgMember(user.handle)

    // Remove the user from the organization (if they're not a GitHub or Microsoft
    // employee). This will also remove them from the team.
    if (
      !response.user.isEmployee &&
      !response.user.email.includes('@microsoft.com') &&
      memberState === 'active'
    )
      await octokit.rest.orgs.removeMember({
        org: Common.OWNER,
        username: user.handle
      })

    // If the membership is still pending, cancel the invitation.
    if (
      !response.user.isEmployee &&
      !response.user.email.includes('@microsoft.com') &&
      memberState === 'pending'
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
  }

  // Check if the issue is open.
  if (issue.state !== 'open') return core.info(`Issue Closed: #${issue.number}`)

  // Add the closed comment to the request issue.
  await octokit.rest.issues.createComment({
    issue_number: issue.number,
    owner: Common.OWNER,
    repo: Common.ISSUEOPS_REPO,
    body: generateMessage(request)
  })

  // Close the issue.
  await octokit.rest.issues.update({
    owner: Common.OWNER,
    repo: Common.ISSUEOPS_REPO,
    issue_number: issue.number,
    state: 'closed',
    state_reason: 'completed'
  })

  core.info(`Closed Class Request: #${issue.number}`)
}

/**
 * Generates the body for a successfully processed request.
 *
 * @param request Class Request
 * @returns Comment Body
 */
export function generateMessage(request: ClassRequest): string {
  // New class creation
  if (request.action === AllowedIssueCommentAction.ADD_ADMIN) {
    const payload = github.context.payload as IssueCommentEvent
    const user = {
      handle: payload.comment.body.split(' ')[1].split(',')[0],
      email: payload.comment.body.split(' ')[1].split(',')[1]
    }

    return `The following admin has been added: ${user.handle}`
  } else if (request.action === AllowedIssueCommentAction.ADD_USER) {
    const payload = github.context.payload as IssueCommentEvent
    const user = {
      handle: payload.comment.body.split(' ')[1].split(',')[0],
      email: payload.comment.body.split(' ')[1].split(',')[1]
    }

    return `The following member has been added: ${user.handle}`
  } else if (request.action === AllowedIssueAction.CLOSE) {
    return 'It looks like this request was closed. Access has been revoked for all attendees!'
  } else if (request.action === AllowedIssueAction.CREATE) {
    return dedent(`:ballot_box_with_check: **Class Request Complete**
    
      Your request has been provisioned! The following repositories have been created for each attendee:

      | Attendee | Repository |
      |----------|------------|
      ${request.attendees
        .map(
          (attendee) =>
            `| ${attendee.handle} | [\`${Common.OWNER}/${repos.generateRepoName(request, attendee)}\`](https://github.com/${Common.OWNER}/${repos.generateRepoName(request, attendee)}) |`
        )
        .join('\n')}

      The \`${Common.OWNER}/${request.team}\` team has been granted access to each repository.

      ### :warning: **IMPORTANT** :warning:

      - The listed repositories will be automatically **deleted** on **${request.endDate.toISOString()}**.
      - Do not close this issue! Doing so will immediately revoke access and delete the attendee repositories.`)
  } else if (request.action === AllowedIssueCommentAction.REMOVE_ADMIN) {
    const payload = github.context.payload as IssueCommentEvent
    const user = {
      handle: payload.comment.body.split(' ')[1].split(',')[0],
      email: payload.comment.body.split(' ')[1].split(',')[1]
    }

    return `The following admin has been removed: ${user.handle}`
  } else if (request.action === AllowedIssueCommentAction.REMOVE_USER) {
    const payload = github.context.payload as IssueCommentEvent
    const user = {
      handle: payload.comment.body.split(' ')[1].split(',')[0],
      email: payload.comment.body.split(' ')[1].split(',')[1]
    }

    return `The following member has been removed: \`${user.handle}\``
  }

  throw new Error(`Invalid Action: ${request.action}`)
}
