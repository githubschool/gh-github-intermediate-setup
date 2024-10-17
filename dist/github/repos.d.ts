import type { ExecOptions } from '@actions/exec';
import { GitHub } from '@actions/github/lib/utils.js';
import { ClassRequest, Team, User } from '../types.js';
/**
 * Generates the repository name for this class and user.
 *
 * @param request The class request
 * @param user The user
 */
export declare function generateRepoName(request: ClassRequest, user: User): string;
/**
 * Creates the attendee repositories.
 *
 * @param request The class request
 * @param teamName The team to grant access
 * @returns The list of generated repositories
 */
export declare function create(request: ClassRequest, user: User, team: Team): Promise<string>;
/**
 * Configures an attendee repository.
 *
 * @param request The class request
 * @param user The attendee who owns this repo
 * @param repo The repository name
 * @param team The team who will access this repo
 */
export declare function configure(request: ClassRequest, user: User, repo: string, team: Team): Promise<void>;
/**
 * Configure Lab 1: Add a Feature
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab1(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 2: Add Tags
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab2(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 3: Git Bisect
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab3(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 4: Interactive Rebase
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab4(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 5: Cherry-Pick
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab5(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 6: Protect Main
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab6(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 7: GitHub Flow
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab7(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 8: Merge Conflicts
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab8(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 9: Run a Workflow
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab9(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 10: Create a Release
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab10(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 11: Deploy to an Environment
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export declare function configureLab11(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
