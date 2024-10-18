import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types';
import { AllowedIssueAction, AllowedIssueCommentAction } from './enums.js';
/**
 * Checks the event name and payload to determine the action to take.
 *
 * @param name Event Name
 * @param payload Event Payload
 * @returns Action to Take
 */
export declare function getAction(name: string, payload: IssueCommentEvent | IssuesEvent): AllowedIssueAction | AllowedIssueCommentAction | undefined;
