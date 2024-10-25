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

  core.info(`Configured Attendee Repository: ${repo}`)
}

/**
 * Deletes all class repositories.
 *
 * TODO: This does not delete repos for invited users that did not accept.
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
      `${process.env.GITHUB_WORKSPACE}/lab-files/3-git-bisect/${filename}`,
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

  await exec.exec('git', ['push'], options)
  await exec.exec('git', ['checkout', 'main'], options)

  core.info('Configured Lab 3: Git Bisect')
}

/**
 * Configure Lab 4: Interactive Rebase
 *
 * This setup step creates a feature branch off an earlier commit on main, so
 * that students can rebase the feature branch onto the latest commit on main.
 *
 * @param options Exec Options
 * @param octokit Octokit Client
 */
export async function configureLab4(
  options: ExecOptions,
  octokit: InstanceType<typeof GitHub>
): Promise<void> {
  core.info('Configuring Lab 4: Interactive Rebase')

  // Get the file contents.
  const contents = fs.readFileSync(
    `${process.env.GITHUB_WORKSPACE}/lab-files/4-interactive-rebase/html_actuator.1`,
    'utf8'
  )

  // After the lab 3 configuration runs, there should be ~10 commits on main.
  // Get the fifth previous commit SHA.
  const response = await exec.getExecOutput(
    'git',
    ['rev-parse', 'HEAD~5'],
    options
  )
  const sha = response.stdout?.trim()

  // Checkout a feature branch at the SHA.
  await exec.exec(
    'git',
    ['checkout', '-b', 'feature/animate-score', sha],
    options
  )

  // Remove the old file if it exists.
  await exec.exec('rm', ['src/html_actuator.ts'], options)

  // Write the new file.
  fs.writeFileSync(`${options.cwd}/src/html_actuator.ts`, contents, 'utf8')

  // Commit the changes.
  await exec.exec('git', ['add', '.'], options)
  await exec.exec('git', ['commit', '-m', 'Animate score update'], options)
  await exec.exec(
    'git',
    ['push', '--set-upstream', 'origin', 'feature/animate-score'],
    options
  )
  await exec.exec('git', ['checkout', 'main'], options)

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

  // Nothing needs to be done...

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

  // Nothing needs to be done...

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

  // Nothing needs to be done...

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

  // Create the PRs for the first merge conflict to resolve.
  for (let i = 1; i < 3; i++) {
    // Get the file contents.
    const filename = `game_manager.${i}`
    const contents = fs.readFileSync(
      `${process.env.GITHUB_WORKSPACE}/lab-files/8-merge-conflicts/${filename}`,
      'utf8'
    )

    // Checkout a feature branch.
    await exec.exec(
      'git',
      ['checkout', '-b', `feature/tile-value-${i}`],
      options
    )

    // Remove the old file if it exists.
    await exec.exec('rm', ['src/game_manager.ts'], options)

    // Write the new file.
    fs.writeFileSync(`${options.cwd}/src/game_manager.ts`, contents, 'utf8')

    // Commit the changes.
    await exec.exec('git', ['add', '.'], options)
    await exec.exec(
      'git',
      ['commit', '-m', `Increase rate of tiles with value 4`],
      options
    )

    // Push the changes.
    await exec.exec(
      'git',
      ['push', '--set-upstream', 'origin', `feature/tile-value-${i}`],
      options
    )
    await exec.exec('git', ['checkout', 'main'], options)

    // Create the pull request.
    await octokit.rest.pulls.create({
      owner: Common.OWNER,
      repo: (options.cwd as string).split('/').pop() as string,
      head: `feature/tile-value-${i}`,
      base: 'main',
      title: 'Increase rate of tiles with value 4',
      body: 'This PR increases the rate at which random tiles are created with a value of 4, making the game easier.'
    })
  }

  // Create the PRs for the second merge conflict to resolve.
  for (let i = 3; i < 5; i++) {
    // Get the file contents.
    const filename = `game_manager.${i}`
    const contents = fs.readFileSync(
      `${process.env.GITHUB_WORKSPACE}/lab-files/8-merge-conflicts/${filename}`,
      'utf8'
    )

    // Checkout a feature branch.
    await exec.exec(
      'git',
      ['checkout', '-b', `feature/start-tiles-${i}`],
      options
    )

    // Remove the old file if it exists.
    await exec.exec('rm', ['src/game_manager.ts'], options)

    // Write the new file.
    fs.writeFileSync(`${options.cwd}/src/game_manager.ts`, contents, 'utf8')

    // Commit the changes.
    await exec.exec('git', ['add', '.'], options)
    await exec.exec(
      'git',
      ['commit', '-m', `Increase the number of starting tiles`],
      options
    )

    // Push the changes.
    await exec.exec(
      'git',
      ['push', '--set-upstream', 'origin', `feature/start-tiles-${i}`],
      options
    )
    await exec.exec('git', ['checkout', 'main'], options)

    // Create the pull request.
    await octokit.rest.pulls.create({
      owner: Common.OWNER,
      repo: (options.cwd as string).split('/').pop() as string,
      head: `feature/start-tiles-${i}`,
      base: 'main',
      title: 'Increase the number of starting tiles',
      body: 'This PR increases the number of starting tiles in new games, so that players can get started quickly.'
    })
  }

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

  // Nothing needs to be done...

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

  // Nothing needs to be done...

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
