import * as octokit from './octokit.js'

export const getOctokit = () => octokit

export const context = {
  actor: 'test',
  eventName: 'issues',
  payload: {
    action: 'opened',
    issue: {
      body: '### Customer Name\n\nNick Testing Industries\n\n### Customer Abbreviation\n\nNA1\n\n### Start Date\n\n2024-10-17\n\n### End Date\n\n2024-10-20\n\n### Administrators\n\nncalteen,ncalteen@github.com\n\n### Attendees\nncalteen-testuser,ncalteen+github@gmail.com',
      number: 1
    },
    comment: {
      body: ''
    }
  }
}
