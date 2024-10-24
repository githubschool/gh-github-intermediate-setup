import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { AllowedIssueAction, AllowedIssueCommentAction } from '../src/enums'

jest.unstable_mockModule('@actions/core', () => core)

const events = await import('../src/events.js')

describe('events', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAction()', () => {
    it('Returns Expire Action for an Expire Event', () => {
      core.getInput.mockReturnValueOnce('true')

      expect(
        events.getAction('issues', {
          action: 'opened'
        } as any)
      ).toBe(AllowedIssueAction.EXPIRE)
    })

    it('Returns Create Action for Issue Opened Event', () => {
      expect(
        events.getAction('issues', {
          action: 'opened'
        } as any)
      ).toBe(AllowedIssueAction.CREATE)
    })

    it('Returns Create Action for Issue Edited Event', () => {
      expect(
        events.getAction('issues', {
          action: 'edited'
        } as any)
      ).toBe(AllowedIssueAction.CREATE)
    })

    it('Returns Close Action for Issue Closed Event', () => {
      expect(
        events.getAction('issues', {
          action: 'closed'
        } as any)
      ).toBe(AllowedIssueAction.CLOSE)
    })

    it('Returns undefined for Other Issue Events', () => {
      expect(
        events.getAction('issues', {
          action: 'reopened'
        } as any)
      ).toBe(undefined)
    })

    it('Returns Add Admin Action for .add-admin Issue Comment Events', () => {
      expect(
        events.getAction('issue_comment', {
          action: 'created',
          comment: {
            body: '.add-admin handle,email'
          }
        } as any)
      ).toBe(AllowedIssueCommentAction.ADD_ADMIN)
    })

    it('Returns Add User for .add-user Issue Comment Events', () => {
      expect(
        events.getAction('issue_comment', {
          action: 'created',
          comment: {
            body: '.add-user handle,email'
          }
        } as any)
      ).toBe(AllowedIssueCommentAction.ADD_USER)
    })

    it('Returns Remove Admin for .remove-admin Issue Comment Events', () => {
      expect(
        events.getAction('issue_comment', {
          action: 'created',
          comment: {
            body: '.remove-admin handle,email'
          }
        } as any)
      ).toBe(AllowedIssueCommentAction.REMOVE_ADMIN)
    })

    it('Returns Remove User for .remove-user Issue Comment Events', () => {
      expect(
        events.getAction('issue_comment', {
          action: 'created',
          comment: {
            body: '.remove-user handle,email'
          }
        } as any)
      ).toBe(AllowedIssueCommentAction.REMOVE_USER)
    })

    it('Returns undefined for Other Events', () => {
      expect(
        events.getAction('pull_request', {
          action: 'opened'
        } as any)
      ).toBe(undefined)
    })
  })
})
