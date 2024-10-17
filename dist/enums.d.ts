/** Allowed Action Types (Issue Event) */
export declare enum AllowedIssueAction {
    /** Close a Class */
    CLOSE = "close",
    /** Create a Class */
    CREATE = "create"
}
/** Allowed Action Types (Issue Comment Event) */
export declare enum AllowedIssueCommentAction {
    /** Add an Administrator */
    ADD_ADMIN = "add-admin",
    /** Add a User */
    ADD_USER = "add-user",
    /** Extend a Class */
    EXTEND = "extend",
    /** Remove an Administrator */
    REMOVE_ADMIN = "remove-admin",
    /** Remove a User */
    REMOVE_USER = "remove-user"
}
/** Fast Track Bot (GitHub App) */
export declare enum Bot {
    /** Email Address */ EMAIL = "153844374+gh-intermediate-issueops[bot]@users.noreply.github.com",
    /** User Name */
    USER = "gh-intermediate-issueops[bot]"
}
/** Common Constants */
export declare enum Common {
    /** IssueOps Repository */
    ISSUEOPS_REPO = "gh-github-intermediate-issueops",
    /** Organization */
    OWNER = "githubschool",
    /** Template Repositoriy */
    TEMPLATE_REPO = "gh-github-intermediate-template"
}
/** Environment Names */
export declare enum Environments {
    /** Dev */
    DEV = "dev",
    /** Prod */
    PROD = "prod"
}
