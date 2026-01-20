import { Octokit } from '@octokit/rest';

export interface LabelIssueInput {
  owner: string;
  repo: string;
  issueNumber: number;
  labels: string[];
}

export interface RemoveLabelInput {
  owner: string;
  repo: string;
  issueNumber: number;
  label: string;
}

export function createLabelIssueAction(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  return {
    name: 'label-issue',
    description: 'Adds or removes labels from GitHub issues',

    async addLabels(input: LabelIssueInput): Promise<string[]> {
      const { data } = await octokit.issues.addLabels({
        owner: input.owner,
        repo: input.repo,
        issue_number: input.issueNumber,
        labels: input.labels,
      });

      return data.map((l) => l.name);
    },

    async removeLabel(input: RemoveLabelInput): Promise<void> {
      await octokit.issues.removeLabel({
        owner: input.owner,
        repo: input.repo,
        issue_number: input.issueNumber,
        name: input.label,
      });
    },

    async setLabels(input: LabelIssueInput): Promise<string[]> {
      const { data } = await octokit.issues.setLabels({
        owner: input.owner,
        repo: input.repo,
        issue_number: input.issueNumber,
        labels: input.labels,
      });

      return data.map((l) => l.name);
    },

    async suggestLabels(
      owner: string,
      repo: string,
      issueTitle: string,
      issueBody: string
    ): Promise<string[]> {
      // Simple keyword-based label suggestion
      const content = `${issueTitle} ${issueBody}`.toLowerCase();
      const suggestions: string[] = [];

      if (content.includes('bug') || content.includes('error') || content.includes('crash')) {
        suggestions.push('bug');
      }
      if (content.includes('feature') || content.includes('request') || content.includes('add')) {
        suggestions.push('enhancement');
      }
      if (content.includes('question') || content.includes('how to') || content.includes('help')) {
        suggestions.push('question');
      }
      if (content.includes('docs') || content.includes('documentation') || content.includes('readme')) {
        suggestions.push('documentation');
      }
      if (content.includes('urgent') || content.includes('critical') || content.includes('asap')) {
        suggestions.push('priority:high');
      }

      return suggestions;
    },
  };
}

export type LabelIssueAction = ReturnType<typeof createLabelIssueAction>;
