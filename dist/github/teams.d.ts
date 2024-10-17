import { ClassRequest, Team, User } from '../types.js';
/**
 * Generates the team name for this class.
 *
 * @param request The class request
 */
export declare function generateTeamName(request: ClassRequest): string;
/**
 * Creates the team for this class.
 *
 * @param request The class request
 * @returns The team slug
 */
export declare function create(request: ClassRequest): Promise<Team>;
/**
 * Adds a member to the team.
 *
 * @param request The class request
 * @param user The user to add
 */
export declare function addUser(request: ClassRequest, user: User, role?: 'member' | 'maintainer'): Promise<void>;
/**
 * Removes a member from the team.
 *
 * @param request The class request
 * @param user The user to add
 */
export declare function removeUser(request: ClassRequest, user: User): Promise<void>;
