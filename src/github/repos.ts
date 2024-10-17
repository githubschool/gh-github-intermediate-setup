import * as core from '@actions/core'
import type { ExecOptions } from '@actions/exec'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils.js'
import { Bot, Common } from '../enums.js'
import { ClassRequest, Team, User } from '../types.js'

/**
 * Generates the repository name for this class and user.
 *
 * @param request The class request
 * @param user The user
 */
export function generateRepoName(request: ClassRequest, user: User): string {
  return `gh-int-${request.customerAbbr.toLowerCase()}-${user.handle}`
}

/**
 * Creates the attendee repositories.
 *
 * @param request The class request
 * @param teamName The team to grant access
 * @returns The list of generated repositories
 */
export async function create(
  request: ClassRequest,
  user: User,
  team: Team
): Promise<string> {
  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.repos.createUsingTemplate({
    template_owner: Common.OWNER,
    template_repo: Common.TEMPLATE_REPO,
    owner: Common.OWNER,
    name: generateRepoName(request, user),
    description: `GitHub Intermediate - ${request.customerName}`,
    include_all_branches: true,
    private: true
  })

  // Grant the team access to the repository.
  await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
    org: Common.OWNER,
    team_slug: team.slug,
    owner: Common.OWNER,
    repo: response.data.name,
    permission: 'admin'
  })

  return response.data.name
}

/**
 * Configures an attendee repository.
 *
 * @param request The class request
 * @param user The attendee who owns this repo
 * @param repo The repository name
 * @param team The team who will access this repo
 */
export async function configure(
  request: ClassRequest,
  user: User,
  repo: string,
  team: Team
): Promise<void> {
  core.info(`Configuring Attendee Repository: ${repo}`)

  const workspace: string = core.getInput('workspace', { required: true })

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Create the deployments environment.
  await octokit.rest.repos.createOrUpdateEnvironment({
    owner: Common.OWNER,
    repo,
    environment_name: 'deployments'
  })

  // Configure GitHub Pages.
  const response = await octokit.rest.repos.createPagesSite({
    owner: Common.OWNER,
    repo,
    build_type: 'workflow'
  })

  // Update the About page of the repo to include the URL.
  // await octokit.rest.repos.updateInformationAboutPagesSite(P)
  await octokit.rest.repos.update({
    owner: Common.OWNER,
    repo,
    homepage: response.data.html_url
  })

  // Configure the exec options.
  const options: exec.ExecOptions = {
    cwd: workspace,
    listeners: {
      stdout: (data: Buffer) => {
        core.info(data.toString())
      },
      stderr: (data: Buffer) => {
        core.error(data.toString())
      }
    }
  }

  // Clone the repository to the local workspace.
  core.info(`Cloning ${repo} to ${workspace}/${repo}`)
  await exec.exec(
    'git',
    [
      'clone',
      `https://x-access-token:${token}@github.com/${Common.OWNER}/${repo}.git`
    ],
    options
  )
  await exec.exec(
    'git',
    [
      'remote',
      'set-url',
      'origin',
      `https://x-access-token:${token}@github.com/${Common.OWNER}/${repo}.git`
    ],
    options
  )

  // Update the working directory to the checked out repository.
  options.cwd = `${workspace}/${repo}`

  // Configure the Git user.
  core.info('Configuring Git')
  await exec.exec('git', ['config', 'user.name', `"${Bot.USER}"`], options)
  await exec.exec('git', ['config', 'user.email', `"${Bot.EMAIL}"`], options)

  // Configure the labs
  await configureLab1(options, octokit)
  await configureLab2(options, octokit)
  await configureLab3(options, octokit)
  await configureLab4(options, octokit)
  await configureLab5(options, octokit)
  await configureLab6(options, octokit)
  await configureLab7(options, octokit)
  await configureLab8(options, octokit)
  await configureLab9(options, octokit)
  await configureLab10(options, octokit)
  await configureLab11(options, octokit)

  core.info(`Configured Attendee Repository: ${repo}`)
}

/**
 * Configure Lab 1: Add a Feature
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function configureLab1(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 1: Add a Feature')

  // Nothing needs to be done...

  core.info('Configured Lab 1: Add a Feature')
}

/**
 * Configure Lab 2: Add Tags
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab2(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 2: Add Tags')

  // Nothing needs to be done...

  core.info('Configured Lab 2: Add Tags')
}

/**
 * Configure Lab 3: Git Bisect
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab3(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 3: Git Bisect')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 3: Git Bisect')
}

/**
 * Configure Lab 4: Interactive Rebase
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab4(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 4: Interactive Rebase')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 4: Interactive Rebase')
}

/**
 * Configure Lab 5: Cherry-Pick
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab5(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 5: Cherry-Pick')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 5: Cherry-Pick')
}

/**
 * Configure Lab 6: Protect Main
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab6(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 6: Protect Main')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 6: Protect Main')
}

/**
 * Configure Lab 7: GitHub Flow
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab7(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 7: GitHub Flow')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 7: GitHub Flow')
}

/**
 * Configure Lab 8: Merge Conflicts
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab8(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 8: Merge Conflicts')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 8: Merge Conflicts')
}

/**
 * Configure Lab 9: Run a Workflow
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab9(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 9: Run a Workflow')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 9: Run a Workflow')
}

/**
 * Configure Lab 10: Create a Release
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab10(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 10: Create a Release')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 10: Create a Release')
}

/**
 * Configure Lab 11: Deploy to an Environment
 *
 * @param options Exec options
 * @param octokit Octokit client
 */
export async function configureLab11(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
) {
  core.info('Configuring Lab 11: Deploy to an Environment')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 11: Deploy to an Environment')
}
