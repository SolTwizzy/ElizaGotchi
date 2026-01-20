import { Octokit } from '@octokit/rest';

export interface CreateReleaseInput {
  owner: string;
  repo: string;
  tagName: string;
  name: string;
  body: string;
  draft?: boolean;
  prerelease?: boolean;
  targetCommitish?: string;
}

export interface CreatedRelease {
  id: number;
  url: string;
  tagName: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  publishedAt: string | null;
}

export function createReleaseAction(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  return {
    name: 'create-release',
    description: 'Creates GitHub releases',

    async createRelease(input: CreateReleaseInput): Promise<CreatedRelease> {
      const { data } = await octokit.repos.createRelease({
        owner: input.owner,
        repo: input.repo,
        tag_name: input.tagName,
        name: input.name,
        body: input.body,
        draft: input.draft || false,
        prerelease: input.prerelease || false,
        target_commitish: input.targetCommitish,
      });

      return {
        id: data.id,
        url: data.html_url,
        tagName: data.tag_name,
        name: data.name,
        body: data.body ?? null,
        draft: data.draft,
        prerelease: data.prerelease,
        publishedAt: data.published_at,
      };
    },

    async listReleases(
      owner: string,
      repo: string,
      limit: number = 10
    ): Promise<CreatedRelease[]> {
      const { data } = await octokit.repos.listReleases({
        owner,
        repo,
        per_page: limit,
      });

      return data.map((release) => ({
        id: release.id,
        url: release.html_url,
        tagName: release.tag_name,
        name: release.name,
        body: release.body ?? null,
        draft: release.draft,
        prerelease: release.prerelease,
        publishedAt: release.published_at,
      }));
    },

    async getLatestRelease(owner: string, repo: string): Promise<CreatedRelease | null> {
      try {
        const { data } = await octokit.repos.getLatestRelease({ owner, repo });

        return {
          id: data.id,
          url: data.html_url,
          tagName: data.tag_name,
          name: data.name,
          body: data.body ?? null,
          draft: data.draft,
          prerelease: data.prerelease,
          publishedAt: data.published_at,
        };
      } catch {
        return null;
      }
    },

    async generateReleaseNotes(
      owner: string,
      repo: string,
      tagName: string,
      previousTagName?: string
    ): Promise<{ name: string; body: string }> {
      const { data } = await octokit.repos.generateReleaseNotes({
        owner,
        repo,
        tag_name: tagName,
        previous_tag_name: previousTagName,
      });

      return {
        name: data.name,
        body: data.body,
      };
    },
  };
}

export type CreateReleaseAction = ReturnType<typeof createReleaseAction>;
