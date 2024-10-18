import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types';
import { AllowedIssueAction, AllowedIssueCommentAction } from '../enums.js';
import type { ClassRequest } from '../types.js';
/**
 * Parses the issue body and returns a JSON object.
 *
 * @param issue The issue to parse.
 * @param action The action being taken on the request.
 * @returns The class request.
 */
export declare function parse(issue: IssueCommentEvent['issue'] | IssuesEvent['issue'], action: AllowedIssueAction | AllowedIssueCommentAction): ClassRequest;
/**
 * Completes the class request.
 *
 * Adds a comment to the request issue with the provisioned repositories and
 * teams.
 *
 * @param issue The request issue.
 * @param request The class request.
 */
export declare function complete(issue: IssueCommentEvent['issue'], request: ClassRequest): Promise<void>;
/**
 * Closes a request.
 *
 * Deletes the repositories and teams, revokes access, closes the issue, and
 * adds a comment.
 *
 * @param issue The issue payload.
 * @param request The class request.
 */
export declare function close(issue: IssueCommentEvent['issue'], request: ClassRequest): Promise<void>;
/**
 * Generates the body for a successfully processed request.
 *
 * The specific text depends on the type of action being taken in the request.
 *
 * @param request The class request.
 * @returns The body of the success comment.
 */
export declare function generateMessage(request: ClassRequest): string;
