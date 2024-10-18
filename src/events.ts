import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types'
import { AllowedIssueAction, AllowedIssueCommentAction } from './enums.js'

/**
 * Checks the event name and payload to determine the action to take.
 *
 * @param name Event Name
 * @param payload Event Payload
 * @returns Action to Take
 */
export function getAction(
  name: string,
  payload: IssueCommentEvent | IssuesEvent
): AllowedIssueAction | AllowedIssueCommentAction | undefined {
  if (name === 'issues') {
    // Issue open/edit only supports the `create` action.
    if (payload.action === 'opened' || payload.action === 'edited')
      return AllowedIssueAction.CREATE

    // Issue close only supports the `close` action.
    if (payload.action === 'closed') return AllowedIssueAction.CLOSE

    // Otherwise, return undefined.
    return undefined
  }

  if (name === 'issue_comment' && payload.action === 'created') {
    if (payload.comment.body.startsWith('.add-admin'))
      return AllowedIssueCommentAction.ADD_ADMIN

    if (payload.comment.body.startsWith('.add-user'))
      return AllowedIssueCommentAction.ADD_USER

    if (payload.comment.body.startsWith('.remove-admin'))
      return AllowedIssueCommentAction.REMOVE_ADMIN

    if (payload.comment.body.startsWith('.remove-user'))
      return AllowedIssueCommentAction.REMOVE_USER
  }

  return undefined
}
