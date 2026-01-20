import { Octokit } from '@octokit/rest';

export interface Issue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: string[];
  author: string;
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  comments: number;
  isPullRequest: boolean;
}

export interface IssueComment {
  id: number;
  body: string;
  author: string;
  createdAt: string;
}

export function createIssuesProvider(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  return {
    name: 'issues-provider',
    description: 'Provides GitHub issues data',

    async listIssues(
      owner: string,
      repo: string,
      options?: {
        state?: 'open' | 'closed' | 'all';
        labels?: string[];
        limit?: number;
      }
    ): Promise<Issue[]> {
      const { data } = await octokit.issues.listForRepo({
        owner,
        repo,
        state: options?.state || 'open',
        labels: options?.labels?.join(','),
        per_page: options?.limit || 30,
      });

      return data.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body ?? null,
        state: issue.state as 'open' | 'closed',
        labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
        author: issue.user?.login || 'unknown',
        assignees: issue.assignees?.map((a) => a.login) || [],
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        comments: issue.comments,
        isPullRequest: !!issue.pull_request,
      }));
    },

    async getIssue(owner: string, repo: string, issueNumber: number): Promise<Issue> {
      const { data } = await octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return {
        number: data.number,
        title: data.title,
        body: data.body ?? null,
        state: data.state as 'open' | 'closed',
        labels: data.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
        author: data.user?.login || 'unknown',
        assignees: data.assignees?.map((a) => a.login) || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        comments: data.comments,
        isPullRequest: !!data.pull_request,
      };
    },

    async getIssueComments(
      owner: string,
      repo: string,
      issueNumber: number
    ): Promise<IssueComment[]> {
      const { data } = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return data.map((comment) => ({
        id: comment.id,
        body: comment.body || '',
        author: comment.user?.login || 'unknown',
        createdAt: comment.created_at,
      }));
    },

    async searchIssues(
      query: string,
      options?: { limit?: number }
    ): Promise<Issue[]> {
      const { data } = await octokit.search.issuesAndPullRequests({
        q: query,
        per_page: options?.limit || 30,
      });

      return data.items.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || null,
        state: issue.state as 'open' | 'closed',
        labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
        author: issue.user?.login || 'unknown',
        assignees: issue.assignees?.map((a) => a.login) || [],
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        comments: issue.comments,
        isPullRequest: !!issue.pull_request,
      }));
    },
  };
}

export type IssuesProvider = ReturnType<typeof createIssuesProvider>;
