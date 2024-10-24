/** Allowed Action Types (Issue Event) */
export enum AllowedIssueAction {
  /** Close a Class */
  CLOSE = 'close',
  /** Create a Class */
  CREATE = 'create',
  /** Expire Classes */
  EXPIRE = 'expire'
}

/** Allowed Action Types (Issue Comment Event) */
export enum AllowedIssueCommentAction {
  /** Add an Administrator */
  ADD_ADMIN = 'add-admin',
  /** Add a User */
  ADD_USER = 'add-user',
  /** Remove an Administrator */
  REMOVE_ADMIN = 'remove-admin',
  /** Remove a User */
  REMOVE_USER = 'remove-user'
}

/** Fast Track Bot (GitHub App) */
export enum Bot {
  /** Email Address */
  EMAIL = '153844374+gh-intermediate-issueops[bot]@users.noreply.github.com',
  /** User Name */
  USER = 'gh-intermediate-issueops[bot]'
}

/** Common Constants */
export enum Common {
  /** IssueOps Repository */
  ISSUEOPS_REPO = 'gh-github-intermediate-issueops',
  /** Organization */
  OWNER = 'githubschool',
  /** Template Repositoriy */
  TEMPLATE_REPO = 'gh-github-intermediate-template'
}
