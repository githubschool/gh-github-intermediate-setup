import type { ExecOptions } from '@actions/exec';
import type { GitHub } from '@actions/github/lib/utils.js';
import type { ClassRequest, Team, User } from '../types.js';
/**
 * Generates the repository name for this class and user.
 *
 * @param request Class Request
 * @param user User
 */
export declare function generateRepoName(request: ClassRequest, user: User): string;
/**
 * Creates a repository for an attendee.
 *
 * @param request Class Request
 * @param team Team
 * @returns Repository Name
 */
export declare function create(request: ClassRequest, user: User, team: Team): Promise<string>;
/**
 * Checks if the repository exists.
 *
 * @param request Class Request
 * @param user User
 * @returns True if the Repository Exists
 */
export declare function exists(request: ClassRequest, user: User): Promise<boolean>;
/**
 * Configures an attendee repository.
 *
 * @param request Class Request
 * @param user User
 * @param repo Repository Name
 * @param team Team
 */
export declare function configure(request: ClassRequest, user: User, repo: string, team: Team): Promise<void>;
/**
 * Deletes all class repositories.
 *
 * @param request Class Request
 */
export declare function deleteRepositories(request: ClassRequest): Promise<void>;
/**
 * Configure Lab 1: Add a Feature
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab1(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 2: Add Tags
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab2(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 3: Git Bisect
 *
 * This setup step creates a number of commits in the lab repository. One commit
 * will contain the specific code that the student will need to bisect to find.
 * The remainder are just filler commits to make the history more complex.
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab3(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 4: Interactive Rebase
 *
 * This setup step creates a feature branch off an earlier commit on main, so
 * that students can rebase the feature branch onto the latest commit on main.
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab4(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 5: Cherry-Pick
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab5(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 6: Protect Main
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab6(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 7: GitHub Flow
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab7(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 8: Merge Conflicts
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab8(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 9: Run a Workflow
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab9(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 10: Create a Release
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab10(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
/**
 * Configure Lab 11: Deploy to an Environment
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export declare function configureLab11(options: ExecOptions, octokit: InstanceType<typeof GitHub>): Promise<void>;
