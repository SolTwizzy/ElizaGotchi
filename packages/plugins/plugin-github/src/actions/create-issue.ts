import { Octokit } from '@octokit/rest';

export interface CreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface CreatedIssue {
  number: number;
  url: string;
  title: string;
}

export function createIssueAction(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  return {
    name: 'create-issue',
    description: 'Creates a new GitHub issue',

    async execute(input: CreateIssueInput): Promise<CreatedIssue> {
      const { data } = await octokit.issues.create({
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        body: input.body,
        labels: input.labels,
        assignees: input.assignees,
        milestone: input.milestone,
      });

      return {
        number: data.number,
        url: data.html_url,
        title: data.title,
      };
    },
  };
}

export type CreateIssueAction = ReturnType<typeof createIssueAction>;
