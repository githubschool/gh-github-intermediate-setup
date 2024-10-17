import * as core from '@actions/core'
import * as github from '@actions/github'
import { IssueCommentEvent } from '@octokit/webhooks-types'
import { dedent } from 'ts-dedent'
import {
  AllowedIssueAction,
  AllowedIssueCommentAction,
  Common
} from './enums.js'
import * as issues from './github/issues.js'
import * as repos from './github/repos.js'
import * as teams from './github/teams.js'
import type { ClassRequest } from './types.js'

/**
 * The main function for the action.
 */
export async function run(): Promise<void> {
  // Get needed GitHub context information.
  const eventName = github.context.eventName
  const payload = github.context.payload

  // Get the action inputs.
  let action: string = core.getInput('action', { required: true })

  // Fail if the action is being run on an unsupported event type.
  if (eventName !== 'issue_comment' && eventName !== 'issues')
    return core.setFailed(
      'This action can only be run on `issues` and `issue_comment` events.'
    )

  if (
    eventName === 'issues' &&
    (payload.action === 'edited' || payload.action === 'opened')
  )
    // Issue open/edit only supports `create` actions.
    action = AllowedIssueAction.CREATE
  else if (eventName === 'issues' && payload.action === 'closed')
    // Issue close event only supports `close` actions.
    action = AllowedIssueAction.CLOSE
  else if (
    eventName === 'issue_comment' &&
    (payload.action === 'created' || payload.action === 'edited') &&
    !Object.values(AllowedIssueCommentAction).includes(
      action as AllowedIssueCommentAction
    )
  )
    // Issue comment create/edit events support the remaining actions.
    return core.setFailed(`Invalid \`issue_comment\` Action: ${action}`)
  // Invalid action
  else return core.setFailed(`Invalid Action: ${action}`)

  // Parse the issue to get the request.
  try {
    const request: ClassRequest = issues.parse(
      (payload as IssueCommentEvent).issue,
      action as AllowedIssueAction | AllowedIssueCommentAction
    )

    if (action === AllowedIssueAction.CREATE) {
      core.info('Processing Class Create')

      // TODO: Check if team, repos, and/or users already exist and fail if they do.

      // Create the team and add the users.
      const team = await teams.create(request)

      // Create and configure the repositories.
      core.info('Creating Attendee Repositories')
      const repoNames: string[] = []
      for (const user of request.attendees) {
        const repo = await repos.create(request, user, team)
        repoNames.push(repo)

        await repos.configure(request, user, repo, team)
        core.info(`  - ${repo}`)
      }
      core.info('Created Attendee Repositories')
    }
  } catch (error: any) {
    const token: string = core.getInput('github_token', { required: true })
    const octokit = github.getOctokit(token)

    // Add the closed comment to the request issue.
    await octokit.rest.issues.createComment({
      issue_number: (payload as IssueCommentEvent).issue.number,
      owner: Common.OWNER,
      repo: Common.ISSUEOPS_REPO,
      body: dedent(
        `There was an error processing your request: ${error.message}`
      )
    })
    core.setFailed(error.message)
  }
}
