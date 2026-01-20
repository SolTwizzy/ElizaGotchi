import { Octokit } from '@octokit/rest';

export interface CommentIssueInput {
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
}

export interface CreatedComment {
  id: number;
  url: string;
  body: string;
}

export function createCommentIssueAction(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  return {
    name: 'comment-issue',
    description: 'Adds comments to GitHub issues',

    async addComment(input: CommentIssueInput): Promise<CreatedComment> {
      const { data } = await octokit.issues.createComment({
        owner: input.owner,
        repo: input.repo,
        issue_number: input.issueNumber,
        body: input.body,
      });

      return {
        id: data.id,
        url: data.html_url,
        body: data.body || '',
      };
    },

    async updateComment(
      owner: string,
      repo: string,
      commentId: number,
      body: string
    ): Promise<CreatedComment> {
      const { data } = await octokit.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body,
      });

      return {
        id: data.id,
        url: data.html_url,
        body: data.body || '',
      };
    },

    async deleteComment(
      owner: string,
      repo: string,
      commentId: number
    ): Promise<void> {
      await octokit.issues.deleteComment({
        owner,
        repo,
        comment_id: commentId,
      });
    },
  };
}

export type CommentIssueAction = ReturnType<typeof createCommentIssueAction>;
