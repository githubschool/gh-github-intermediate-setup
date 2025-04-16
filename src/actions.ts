import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { dedent } from 'ts-dedent'
import * as repos from './github/repos.js'
import * as teams from './github/teams.js'
import * as users from './github/users.js'
import type { Classroom } from './types.js'

/**
 * Creates a classroom.
 *
 * @param octokit Octokit
 * @param classroom Classroom
 */
export async function createClass(
  octokit: InstanceType<typeof Octokit>,
  classroom: Classroom
): Promise<void> {
  core.info(`Creating Classroom: ${classroom.customerName}`)

  // Check if the team already exists.
  if (await teams.exists(octokit, classroom)) {
    core.error(`Team Already Exists: ${teams.generateTeamName(classroom)}`)
    return
  }

  // Check if any user repositories already exist.
  for (const user of classroom.attendees) {
    if (await repos.exists(octokit, classroom, user)) {
      core.error(
        `Repository Already Exists: ${repos.generateRepoName(classroom, user)}`
      )
      return
    }
  }

  // Create the team and add the users.
  await teams.create(octokit, classroom)

  // Get the unique list of users (attendees and administrators).
  const users = [
    ...new Set([...classroom.attendees, ...classroom.administrators])
  ]

  // Create and configure the user repositories.
  for (const user of users) {
    const repo = await repos.create(octokit, classroom, user)

    // Sleep 5s to wait for the repo to be created and initial commit pushed.
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'test')
      await new Promise((resolve) => setTimeout(resolve, 10000))

    await repos.configure(octokit, classroom, repo)
  }

  core.info('')
  core.info('===============================================================')
  core.info('')
  core.info(dedent`Created Classroom: ${classroom.customerName}

  ===============================================================

  The following repositories have been created for each attendee:

  ${classroom.attendees
    .map(
      (attendee) =>
        `- ${attendee} | ${classroom.organization}/${repos.generateRepoName(classroom, attendee)}`
    )
    .join('\n')}

  The \`${classroom.organization}/${teams.generateTeamName(classroom)}\` team has been granted access to each repository.

  If you need to add/remove users or administrators, use the commands below.

  | Command                                  | Description                               |
  |------------------------------------------|-------------------------------------------|
  | node dist/index.js add-user <handle>     | Add a user to the class.                  |
  | node dist/index.js remove-user <handle>  | Remove a user from the class.             |
  | node dist/index.js add-admin <handle>    | Add an administrator to the class.        |
  | node dist/index.js remove-admin <handle> | Remove an administrator from the class.   |

  To close the class, use the command below.

  | Command                  | Description      |
  |--------------------------|------------------|
  | node dist/index.js close | Close the class. |
  `)
}

/**
 * Closes a class.
 *
 * @param octokit Octokit
 * @param classroom Classroom
 */
export async function closeClass(
  octokit: InstanceType<typeof Octokit>,
  classroom: Classroom
): Promise<void> {
  core.info(`Closing Classroom: ${classroom.customerName}`)

  // Delete user repositories.
  await repos.deleteRepositories(octokit, classroom)

  // Remove users from the organization.
  await users.removeUsers(octokit, classroom)

  // Delete the team.
  await teams.deleteTeam(octokit, classroom)

  core.info(`Closed Classroom: ${classroom.customerName}`)
}

/**
 * Adds a user to a class.
 *
 * @param octokit Octokit
 * @param classroom Classroom
 * @param handle GitHub Handle
 */
export async function addUser(
  octokit: InstanceType<typeof Octokit>,
  classroom: Classroom,
  handle: string
): Promise<void> {
  core.info(`\tAdding User to Classroom: ${handle}`)

  // Check if the user is already in the team and the repository already exists.
  /* istanbul ignore next */
  if (
    (await repos.exists(octokit, classroom, handle)) &&
    (classroom.attendees.includes(handle) ||
      classroom.administrators.includes(handle))
  ) {
    core.info(`User Already Added: ${handle}`)
    return
  }

  // Add the user to the team.
  await teams.addUser(octokit, classroom, handle, 'member')

  // Create and configure their repository.
  const repo = await repos.create(octokit, classroom, handle)

  // Sleep 5s to wait for the repo to be created and initial commit pushed.
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'test')
    await new Promise((resolve) => setTimeout(resolve, 10000))

  await repos.configure(octokit, classroom, repo)

  classroom.attendees.push(handle)

  core.info(dedent`Added User to Classroom: ${handle}

  The following repository has been created for the user:

  - ${handle} | ${classroom.organization}/${repos.generateRepoName(classroom, handle)}`)
}

/**
 * Removes a user from the class.
 *
 * @param octokit Octokit
 * @param classroom Classroom
 * @param handle GitHub Handle
 */
export async function removeUser(
  octokit: InstanceType<typeof Octokit>,
  classroom: Classroom,
  handle: string
): Promise<void> {
  core.info(`Removing User from Classroom: ${handle}`)

  // Check if the user is also in the administrators list.
  if (classroom.administrators.includes(handle)) {
    core.error(`User is an Administrator: ${handle}`)
    return
  }
  // Check if the user is in the attendees list.
  if (!classroom.attendees.includes(handle)) {
    core.error(`User Not Found: ${handle}`)
    return
  }

  // Get the user's membership state.
  const memberState = await users.isOrgMember(octokit, classroom, handle)

  // Remove the user from the organization (if they are not an administrator).
  // This will also remove them from the team.
  if (memberState === 'active')
    await octokit.rest.orgs.removeMember({
      org: classroom.organization,
      username: handle
    })

  // If the membership is still pending, cancel the invitation.
  if (memberState === 'pending') {
    // Get the invitation ID.
    const invitations = await octokit.paginate(
      octokit.rest.orgs.listPendingInvitations,
      {
        org: classroom.organization
      }
    )

    for (const invitation of invitations)
      if (invitation.login === handle)
        await octokit.rest.orgs.cancelInvitation({
          org: classroom.organization,
          invitation_id: invitation.id
        })
  }

  // Delete the user repository.
  if (await repos.exists(octokit, classroom, handle))
    await octokit.rest.repos.delete({
      owner: classroom.organization,
      repo: repos.generateRepoName(classroom, handle)
    })

  // Remove from the team.
  await teams.removeUser(octokit, classroom, handle)

  // Remove from the attendees list.
  classroom.attendees = classroom.attendees.filter((user) => user !== handle)

  core.info(`Removed User from Class Request: ${handle}`)
}

/**
 * Adds an administrator to a class.
 *
 * @param octokit Octokit
 * @param classroom Classroom
 * @param handle GitHub Handle
 */
export async function addAdmin(
  octokit: InstanceType<typeof Octokit>,
  classroom: Classroom,
  handle: string
): Promise<void> {
  core.info(`Adding Admin to Classroom: ${handle}`)

  // Check if the user is already in the team and the repository already exists.
  /* istanbul ignore next */
  if (
    (await repos.exists(octokit, classroom, handle)) &&
    classroom.administrators.includes(handle)
  ) {
    core.info(`Admin Already Added: ${handle}`)
    return
  }

  // Add the user to the team.
  await teams.addUser(octokit, classroom, handle, 'maintainer')

  // Create and configure their repository.
  const repo = await repos.create(octokit, classroom, handle)

  // Sleep 5s to wait for the repo to be created and initial commit pushed.
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'test')
    await new Promise((resolve) => setTimeout(resolve, 10000))

  await repos.configure(octokit, classroom, repo)

  classroom.administrators.push(handle)

  core.info(dedent`Added Admin to Classroom: ${handle}

  The following repository has been created for the user:

  - ${handle} | ${classroom.organization}/${repos.generateRepoName(classroom, handle)}`)
}

/**
 * Removes an administrator from the class.
 *
 * @param octokit Octokit
 * @param classroom Classroom
 * @param handle GitHub Handle
 */
export async function removeAdmin(
  octokit: InstanceType<typeof Octokit>,
  classroom: Classroom,
  handle: string
): Promise<void> {
  core.info(`Removing Admin from Classroom: ${handle}`)

  // Check if the user is in the administrators list.
  if (!classroom.administrators.includes(handle)) {
    core.error(`Admin Not Found: ${handle}`)
    return
  }

  // Check if the user who is running this action is the one being removed.
  const authenticatedUser = await octokit.rest.users.getAuthenticated()
  if (authenticatedUser.data.login === handle) {
    core.error(`Cannot Remove Yourself: ${handle}`)
    return
  }

  // Get the user's membership state.
  const memberState = await users.isOrgMember(octokit, classroom, handle)

  // Remove the user from the organization. This will also remove them from the
  // team.
  if (memberState === 'active')
    await octokit.rest.orgs.removeMember({
      org: classroom.organization,
      username: handle
    })

  // If the membership is still pending, cancel the invitation.
  /* istanbul ignore if */
  if (memberState === 'pending') {
    // Get the invitation ID.
    const invitations = await octokit.paginate(
      octokit.rest.orgs.listPendingInvitations,
      {
        org: classroom.organization
      }
    )

    for (const invitation of invitations)
      if (invitation.login === handle)
        await octokit.rest.orgs.cancelInvitation({
          org: classroom.organization,
          invitation_id: invitation.id
        })
  }

  // Delete the user repository.
  if (await repos.exists(octokit, classroom, handle))
    await octokit.rest.repos.delete({
      owner: classroom.organization,
      repo: repos.generateRepoName(classroom, handle)
    })

  // Remove from the team.
  await teams.removeUser(octokit, classroom, handle)

  // Remove from the attendees and administrators lists.
  classroom.attendees = classroom.attendees.filter((user) => user !== handle)
  classroom.administrators = classroom.administrators.filter(
    (user) => user !== handle
  )

  core.info(`Removed Admin from Class Request: ${handle}`)
}
