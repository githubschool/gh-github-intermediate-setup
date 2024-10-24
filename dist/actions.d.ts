import type { IssueCommentEvent, IssuesEvent } from '@octokit/webhooks-types';
import type { ClassRequest } from './types.js';
/**
 * Creates a class from a request.
 *
 * @param request Class Request
 * @param issue Issue Payload
 */
export declare function create(request: ClassRequest, issue: IssuesEvent['issue']): Promise<void>;
/**
 * Closes a class.
 *
 * @param request Class Request
 * @param issue Issue Payload
 */
export declare function close(request: ClassRequest, issue: IssuesEvent['issue']): Promise<void>;
/**
 * Expires any open classes.
 */
export declare function expire(): Promise<void>;
/**
 * Adds an administrator to a class.
 *
 * @param request Class Request
 * @param payload Issue Comment Payload
 */
export declare function addAdmin(request: ClassRequest, payload: IssueCommentEvent): Promise<void>;
/**
 * Adds an user to a class.
 *
 * @param request Class Request
 * @param payload Issue Comment Payload
 */
export declare function addUser(request: ClassRequest, payload: IssueCommentEvent): Promise<void>;
/**
 * Removes an administrator from the class.
 *
 * @param request Class Request
 * @param payload Issue Comment
 */
export declare function removeAdmin(request: ClassRequest, payload: IssueCommentEvent): Promise<void>;
/**
 * Removes a user from the class.
 *
 * @param request Class Request
 * @param payload Issue Comment Payload
 */
export declare function removeUser(request: ClassRequest, payload: IssueCommentEvent): Promise<void>;
