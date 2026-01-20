import { Octokit } from '@octokit/rest';

export interface Commit {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  additions: number;
  deletions: number;
  files: number;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  author: string;
  baseBranch: string;
  headBranch: string;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  mergedAt: string | null;
  labels: string[];
}

export function createCommitsProvider(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  return {
    name: 'commits-provider',
    description: 'Provides commit and pull request data',

    async listCommits(
      owner: string,
      repo: string,
      options?: {
        branch?: string;
        since?: string;
        until?: string;
        limit?: number;
      }
    ): Promise<Commit[]> {
      const { data } = await octokit.repos.listCommits({
        owner,
        repo,
        sha: options?.branch,
        since: options?.since,
        until: options?.until,
        per_page: options?.limit || 30,
      });

      return data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.author?.login || commit.commit.author?.name || 'unknown',
        authorEmail: commit.commit.author?.email || '',
        date: commit.commit.author?.date || '',
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        files: commit.files?.length || 0,
      }));
    },

    async getCommit(owner: string, repo: string, sha: string): Promise<Commit> {
      const { data } = await octokit.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });

      return {
        sha: data.sha,
        message: data.commit.message,
        author: data.author?.login || data.commit.author?.name || 'unknown',
        authorEmail: data.commit.author?.email || '',
        date: data.commit.author?.date || '',
        additions: data.stats?.additions || 0,
        deletions: data.stats?.deletions || 0,
        files: data.files?.length || 0,
      };
    },

    async listPullRequests(
      owner: string,
      repo: string,
      options?: {
        state?: 'open' | 'closed' | 'all';
        base?: string;
        limit?: number;
      }
    ): Promise<PullRequest[]> {
      const { data } = await octokit.pulls.list({
        owner,
        repo,
        state: options?.state || 'open',
        base: options?.base,
        per_page: options?.limit || 30,
      });

      return data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        body: pr.body ?? null,
        state: pr.merged_at ? 'merged' : (pr.state as 'open' | 'closed'),
        author: pr.user?.login || 'unknown',
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref,
        commits: 0, // Would need separate API call
        additions: 0, // Not available from list endpoint
        deletions: 0, // Not available from list endpoint
        changedFiles: 0, // Not available from list endpoint
        createdAt: pr.created_at,
        mergedAt: pr.merged_at,
        labels: pr.labels.map((l) => l.name || ''),
      }));
    },

    async getPullRequest(
      owner: string,
      repo: string,
      prNumber: number
    ): Promise<PullRequest> {
      const { data } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      return {
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.merged_at ? 'merged' : (data.state as 'open' | 'closed'),
        author: data.user?.login || 'unknown',
        baseBranch: data.base.ref,
        headBranch: data.head.ref,
        commits: data.commits,
        additions: data.additions,
        deletions: data.deletions,
        changedFiles: data.changed_files,
        createdAt: data.created_at,
        mergedAt: data.merged_at,
        labels: data.labels.map((l) => l.name || ''),
      };
    },

    async compareBranches(
      owner: string,
      repo: string,
      base: string,
      head: string
    ): Promise<{
      aheadBy: number;
      behindBy: number;
      commits: Commit[];
    }> {
      const { data } = await octokit.repos.compareCommits({
        owner,
        repo,
        base,
        head,
      });

      return {
        aheadBy: data.ahead_by,
        behindBy: data.behind_by,
        commits: data.commits.map((commit) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.author?.login || commit.commit.author?.name || 'unknown',
          authorEmail: commit.commit.author?.email || '',
          date: commit.commit.author?.date || '',
          additions: 0,
          deletions: 0,
          files: 0,
        })),
      };
    },
  };
}

export type CommitsProvider = ReturnType<typeof createCommitsProvider>;
