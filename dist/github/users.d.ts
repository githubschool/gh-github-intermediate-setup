import type { ClassRequest } from '../types.js';
/**
 * Checks if the user is a member of the organization.
 *
 * @param handle User Handle
 * @returns True if User is Member
 */
export declare function isOrgMember(handle: string): Promise<boolean>;
/**
 * Removes all users in this class from the organization.
 *
 * @param request Class Request
 */
export declare function removeUsers(request: ClassRequest): Promise<void>;
