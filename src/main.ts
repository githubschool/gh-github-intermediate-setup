import * as core from '@actions/core'
import * as github from '@actions/github'
import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types'
import fs from 'fs'
import path from 'path'
import { dedent } from 'ts-dedent'
import yaml from 'yaml'
import * as actions from './actions.js'
import {
  AllowedIssueAction,
  AllowedIssueCommentAction,
  Common
} from './enums.js'
import * as events from './events.js'
import * as issues from './github/issues.js'

export async function run(): Promise<void> {
  // Get needed GitHub context information.
  const eventName = github.context.eventName
  const payload = github.context.payload as IssueCommentEvent | IssuesEvent

  // Check if the user is authorized to use this action.
  const authorizedUsers = yaml.parse(
    fs.readFileSync(
      path.resolve(process.env.GITHUB_WORKSPACE!, 'instructors.yml'),
      'utf8'
    )
  ).instructors

  // Check if the user is authorized to use this action.
  const user = github.context.actor
  if (!authorizedUsers.includes(user))
    return core.setFailed(
      `You are not authorized to use this action. Please contact an instructor.`
    )

  // Decide what action to take based on issue state and comment text.
  const action = events.getAction(eventName, payload)
  if (!action)
    return core.info(`Ignoring Action: ${eventName} / ${payload.action}`)

  // The expire action always takes precedence.
  if (action === AllowedIssueAction.EXPIRE) {
    core.info(`Processing Action: ${action}`)
    await actions.expire()

    return
  }

  try {
    core.info(`Processing Action: ${action}`)

    // Parse the issue to get the request.
    const request = issues.parse(payload.issue, action)

    if (action === AllowedIssueAction.CREATE)
      await actions.create(request, payload.issue)
    else if (action === AllowedIssueAction.CLOSE)
      await actions.close(request, payload.issue)
    else if (action === AllowedIssueCommentAction.ADD_ADMIN)
      await actions.addAdmin(request, payload as IssueCommentEvent)
    else if (action === AllowedIssueCommentAction.ADD_USER)
      await actions.addUser(request, payload as IssueCommentEvent)
    else if (action === AllowedIssueCommentAction.REMOVE_ADMIN)
      await actions.removeAdmin(request, payload as IssueCommentEvent)
    else if (action === AllowedIssueCommentAction.REMOVE_USER)
      await actions.removeUser(request, payload as IssueCommentEvent)
  } catch (error: any) {
    const token: string = core.getInput('github_token', { required: true })
    const octokit = github.getOctokit(token)

    // Add the error comment to the request issue.
    await octokit.rest.issues.createComment({
      issue_number: (payload as IssueCommentEvent).issue.number,
      owner: Common.OWNER,
      repo: Common.ISSUEOPS_REPO,
      body: dedent(
        `There was an error processing your request: \`${error.message}\``
      )
    })

    core.setFailed(error.message)
  }
}
