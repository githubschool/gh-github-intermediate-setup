import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import type { Classroom } from '../types.js'

/**
 * Checks if the user is a member of the organization.
 *
 * @param octokit Octokit
 * @param classroom Classroom
 * @param handle GitHub Handle
 * @returns User Membership Status
 */
export async function isOrgMember(
  octokit: InstanceType<typeof Octokit>,
  classroom: Classroom,
  handle: string
): Promise<'pending' | 'active' | undefined> {
  core.info(`Checking if User is Org Member: ${handle}`)

  try {
    const response = await octokit.rest.orgs.getMembershipForUser({
      org: classroom.organization,
      username: handle
    })

    core.info(`User is Org Member: ${handle}`)
    return response.data.state
  } catch (error: any) {
    if (error.status === 404) return undefined
  }
}

/**
 * Removes all users in this class from the organization (except for
 * administrators).
 *
 * @param octokit Octokit
 * @param classroom Classroom
 */
export async function removeUsers(
  octokit: InstanceType<typeof Octokit>,
  classroom: Classroom
): Promise<void> {
  core.info(`Removing Users from the Organization: ${classroom.organization}`)

  for (const handle of classroom.attendees) {
    // Check if the user is an instructor.
    if (classroom.administrators.includes(handle)) {
      core.info(`\tUser is an Administrator: ${handle}`)
      continue
    }

    core.info(`\tRemoving User: ${handle}`)

    if (await isOrgMember(octokit, classroom, handle))
      await octokit.rest.orgs.removeMember({
        org: classroom.organization,
        username: handle
      })
  }
}
