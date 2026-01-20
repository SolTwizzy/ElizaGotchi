import { Octokit } from '@octokit/rest';

export interface RepoInfo {
  owner: string;
  repo: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  defaultBranch: string;
  updatedAt: string;
}

export interface BranchInfo {
  name: string;
  commit: string;
  protected: boolean;
}

export function createRepoProvider(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  return {
    name: 'repo-provider',
    description: 'Provides repository information from GitHub',

    async getRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
      const { data } = await octokit.repos.get({ owner, repo });

      return {
        owner: data.owner.login,
        repo: data.name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        language: data.language,
        defaultBranch: data.default_branch,
        updatedAt: data.updated_at,
      };
    },

    async listBranches(owner: string, repo: string): Promise<BranchInfo[]> {
      const { data } = await octokit.repos.listBranches({ owner, repo });

      return data.map((branch) => ({
        name: branch.name,
        commit: branch.commit.sha,
        protected: branch.protected,
      }));
    },

    async getReadme(owner: string, repo: string): Promise<string | null> {
      try {
        const { data } = await octokit.repos.getReadme({ owner, repo });
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return content;
      } catch {
        return null;
      }
    },

    async listContributors(
      owner: string,
      repo: string
    ): Promise<Array<{ login: string; contributions: number }>> {
      const { data } = await octokit.repos.listContributors({ owner, repo });

      return data.map((contributor) => ({
        login: contributor.login || 'unknown',
        contributions: contributor.contributions,
      }));
    },
  };
}

export type RepoProvider = ReturnType<typeof createRepoProvider>;
