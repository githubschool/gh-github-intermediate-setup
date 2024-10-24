import * as core from '@actions/core'
import type { ExecOptions } from '@actions/exec'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import type { GitHub } from '@actions/github/lib/utils.js'
import fs from 'fs'
import { Bot, Common } from '../enums.js'
import type { ClassRequest, Team, User } from '../types.js'
import * as teams from './teams.js'

/**
 * Generates the repository name for this class and user.
 *
 * @param request Class Request
 * @param user User
 */
export function generateRepoName(request: ClassRequest, user: User): string {
  return `gh-int-${request.customerAbbr.toLowerCase()}-${user.handle}`
}

/**
 * Creates a repository for an attendee.
 *
 * @param request Class Request
 * @param team Team
 * @returns Repository Name
 */
export async function create(
  request: ClassRequest,
  user: User,
  team: Team
): Promise<string> {
  core.info(`Creating Attendee Repository: ${generateRepoName(request, user)}`)

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

  core.info(`Created Attendee Repository: ${generateRepoName(request, user)}`)
  return response.data.name
}

/**
 * Checks if the repository exists.
 *
 * @param request Class Request
 * @param user User
 * @returns True if the Repository Exists
 */
export async function exists(
  request: ClassRequest,
  user: User
): Promise<boolean> {
  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  try {
    await octokit.rest.repos.get({
      owner: Common.OWNER,
      repo: generateRepoName(request, user)
    })
  } catch (error: any) {
    core.info(`Error: ${error.status}`)
    if (error.status === 404) return false
  }

  core.info(`Repo Exists: ${generateRepoName(request, user)}`)
  return true
}

/**
 * Configures an attendee repository.
 *
 * @param request Class Request
 * @param user User
 * @param repo Repository Name
 * @param team Team
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
        /* istanbul ignore next */
        core.info(data.toString())
      },
      stderr: (data: Buffer) => {
        /* istanbul ignore next */
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

  // Update the working directory to the checked out repository.
  options.cwd = `${workspace}/${repo}`

  // Update the remote URL to use the token.
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
  await exec.exec('git', ['push'], options)

  core.info(`Configured Attendee Repository: ${repo}`)
}

/**
 * Deletes all class repositories.
 *
 * @param request Class Request
 */
export async function deleteRepositories(request: ClassRequest): Promise<void> {
  core.info(`Deleting Repositories: #${request.customerAbbr}`)

  // Create the authenticated Octokit client.
  const token: string = core.getInput('github_token', { required: true })
  const octokit = github.getOctokit(token)

  // Get the team members.
  const members = await teams.getMembers(request)

  // Delete the repositories for each member.
  for (const member of members) {
    core.info(`Deleting Repository: ${generateRepoName(request, member)}`)

    if (await exists(request, member))
      await octokit.rest.repos.delete({
        owner: Common.OWNER,
        repo: generateRepoName(request, member)
      })
  }

  core.info(`Deleted Repositories: ${request.customerAbbr}`)
}

/**
 * Configure Lab 1: Add a Feature
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab1(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
  core.info('Configuring Lab 1: Add a Feature')

  // Nothing needs to be done...

  core.info('Configured Lab 1: Add a Feature')
}

/**
 * Configure Lab 2: Add Tags
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab2(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
  core.info('Configuring Lab 2: Add Tags')

  // Nothing needs to be done...

  core.info('Configured Lab 2: Add Tags')
}

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
export async function configureLab3(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
  core.info('Configuring Lab 3: Git Bisect')

  for (let i = 1; i < 10; i++) {
    // Get the file contents.
    const filename = `keyboard_input_manager.test.${i}`
    const contents = fs.readFileSync(
      `../../lab-files/3-git-bisect/${filename}`,
      'utf8'
    )

    // Remove the old file if it exists.
    await exec.exec('rm', ['__tests__/keyboard_input_manager.test.ts'], options)

    // Write the new file.
    fs.writeFileSync(
      `${options.cwd}/__tests__/keyboard_input_manager.test.ts`,
      contents,
      'utf8'
    )

    // Commit the changes.
    await exec.exec('git', ['add', '.'], options)
    await exec.exec('git', ['commit', '-m', `Adding unit tests ${i}`], options)
  }

  core.info('Configured Lab 3: Git Bisect')
}

/**
 * Configure Lab 4: Interactive Rebase
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab4(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
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
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab5(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
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
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab6(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
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
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab7(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
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
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab8(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
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
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab9(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
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
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab10(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
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
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab11(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
  core.info('Configuring Lab 11: Deploy to an Environment')

  // // Commit the updates.
  // core.info('Committing Changes')
  // await exec.exec('git', ['add', '.'], options)
  // await exec.exec('git', ['commit', '-m', 'Initial configuration'], options)

  // core.info('Pushing changes')
  // await exec.exec('git', ['push'], options)

  core.info('Configured Lab 11: Deploy to an Environment')
}
