import { AllowedIssueAction, AllowedIssueCommentAction } from './enums.js'

/** Class Request */
export type ClassRequest = {
  /** Request Action */
  action: AllowedIssueAction | AllowedIssueCommentAction
  /** Customer Name */
  customerName: string
  /** Customer Abbreviation */
  customerAbbr: string
  /** Start Date */
  startDate: Date
  /** End Date */
  endDate: Date
  /** Attendees */
  attendees: User[]
  /** Team */
  team?: string
}

/** Team Information */
export type Team = {
  /** ID */
  id: number
  /** Slug */
  slug: string
}

/** User Information */
export type User = {
  /** Email Address */
  email: string
  /** GitHub.com Handle */
  handle: string
}
