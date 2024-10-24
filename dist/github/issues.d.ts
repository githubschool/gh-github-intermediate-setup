import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types';
import { AllowedIssueAction, AllowedIssueCommentAction } from '../enums.js';
import type { ClassRequest } from '../types.js';
/**
 * Parses the issue body and returns a JSON object.
 *
 * @param issue Issue
 * @param action Action
 * @returns Class Request
 */
export declare function parse(issue: IssueCommentEvent['issue'] | IssuesEvent['issue'], action: AllowedIssueAction | AllowedIssueCommentAction): ClassRequest;
/**
 * Completes the class request.
 *
 * @param issue Issue
 * @param request Class Request
 */
export declare function complete(request: ClassRequest, issue: IssueCommentEvent['issue'] | IssuesEvent['issue']): Promise<void>;
/**
 * Closes a request.
 *
 * @param issue Issue
 * @param request Class Request
 */
export declare function close(issue: IssueCommentEvent['issue'], request: ClassRequest): Promise<void>;
/**
 * Generates the body for a successfully processed request.
 *
 * @param request Class Request
 * @returns Comment Body
 */
export declare function generateMessage(request: ClassRequest): string;
/**
 * Adds one or more labels to an issue.
 *
 * @param issue Issue
 * @param labels Labels
 */
export declare function addLabels(issue: IssueCommentEvent['issue'] | IssuesEvent['issue'], labels: string[]): Promise<void>;
