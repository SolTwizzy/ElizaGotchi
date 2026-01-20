// Internal imports for plugin factory
import { createRepoProvider as _createRepoProvider } from './providers/repo-provider';
import { createIssuesProvider as _createIssuesProvider } from './providers/issues-provider';
import { createCommitsProvider as _createCommitsProvider } from './providers/commits-provider';
import { createIssueAction as _createIssueAction } from './actions/create-issue';
import { createLabelIssueAction as _createLabelIssueAction } from './actions/label-issue';
import { createCommentIssueAction as _createCommentIssueAction } from './actions/comment-issue';
import { createReleaseAction as _createReleaseAction } from './actions/create-release';

// Providers
export { createRepoProvider } from './providers/repo-provider';
export type { RepoProvider, RepoInfo, BranchInfo } from './providers/repo-provider';

export { createIssuesProvider } from './providers/issues-provider';
export type { IssuesProvider, Issue, IssueComment } from './providers/issues-provider';

export { createCommitsProvider } from './providers/commits-provider';
export type { CommitsProvider, Commit, PullRequest } from './providers/commits-provider';

// Actions
export { createIssueAction } from './actions/create-issue';
export type { CreateIssueAction, CreateIssueInput, CreatedIssue } from './actions/create-issue';

export { createLabelIssueAction } from './actions/label-issue';
export type { LabelIssueAction, LabelIssueInput, RemoveLabelInput } from './actions/label-issue';

export { createCommentIssueAction } from './actions/comment-issue';
export type { CommentIssueAction, CommentIssueInput, CreatedComment } from './actions/comment-issue';

export { createReleaseAction } from './actions/create-release';
export type { CreateReleaseAction, CreateReleaseInput, CreatedRelease } from './actions/create-release';

// Plugin factory
export function createGitHubPlugin(accessToken: string) {
  return {
    name: '@elizagotchi/plugin-github',
    version: '0.1.0',
    description: 'GitHub integration plugin for issue management and repository operations',

    providers: {
      repo: _createRepoProvider(accessToken),
      issues: _createIssuesProvider(accessToken),
      commits: _createCommitsProvider(accessToken),
    },

    actions: {
      createIssue: _createIssueAction(accessToken),
      labelIssue: _createLabelIssueAction(accessToken),
      commentIssue: _createCommentIssueAction(accessToken),
      createRelease: _createReleaseAction(accessToken),
    },
  };
}

export type GitHubPlugin = ReturnType<typeof createGitHubPlugin>;

export default createGitHubPlugin;
