import type { ClassRequest, Team, User } from '../types.js';
/**
 * Generates the team name for this class.
 *
 * @param request Class Request
 */
export declare function generateTeamName(request: ClassRequest): string;
/**
 * Checks if the team exists.
 *
 * @param request Class Request
 * @returns True if Team Exists
 */
export declare function exists(request: ClassRequest): Promise<boolean>;
/**
 * Gets the team.
 *
 * @param request Class Request
 * @returns Team Information
 */
export declare function get(request: ClassRequest): Promise<Team>;
/**
 * Creates the team for this class.
 *
 * @param request Class Request
 * @returns Team Information
 */
export declare function create(request: ClassRequest): Promise<Team>;
/**
 * Adds a member to the team.
 *
 * @param request Class Request
 * @param user User to Add
 * @param role Role to Assign
 */
export declare function addUser(request: ClassRequest, user: User, role?: 'member' | 'maintainer'): Promise<void>;
/**
 * Removes a member to the team.
 *
 * @param request Class Request
 * @param user User to Remove
 */
export declare function removeUser(request: ClassRequest, user: User): Promise<void>;
/**
 * Deletes the team.
 *
 * @param request Class Request
 */
export declare function deleteTeam(request: ClassRequest): Promise<void>;
/**
 * Gets the members of the team.
 *
 * @param request Class Request
 * @returns Team Members
 */
export declare function getMembers(request: ClassRequest): Promise<User[]>;
