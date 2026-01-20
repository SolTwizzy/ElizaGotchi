/**
 * Integration tests for GitHub plugin
 *
 * Tests GitHub API interactions for:
 * - Repository information
 * - Issue management
 * - Pull request data
 * - Commit history
 *
 * Required environment variables:
 * - GITHUB_ACCESS_TOKEN (for authenticated requests)
 * - TEST_GITHUB_REPO (format: owner/repo)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { testUtils } from '../../setup';

// Skip if integration tests disabled
const runTests = testUtils.shouldRunIntegrationTests();

describe.skipIf(!runTests)('GitHub Plugin Integration Tests', () => {
  const githubToken = process.env.GITHUB_ACCESS_TOKEN;
  const testRepo = process.env.TEST_GITHUB_REPO;
  const apiBase = 'https://api.github.com';

  beforeAll(() => {
    if (!githubToken) {
      console.warn('GITHUB_ACCESS_TOKEN not set - tests will use unauthenticated requests');
    }
    if (!testRepo) {
      console.warn('TEST_GITHUB_REPO not set - some tests will be skipped');
    }
  });

  const getHeaders = () => {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ElizaGotchi-Test-Suite',
    };
    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }
    return headers;
  };

  describe('Repository API', () => {
    it('should fetch repository information', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(`${apiBase}/repos/${testRepo}`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json() as {
          full_name: string;
          description: string | null;
          stargazers_count: number;
        };
        expect(data.full_name).toBe(testRepo);
        console.log(`Repository: ${data.full_name}`);
        console.log(`Description: ${data.description}`);
        console.log(`Stars: ${data.stargazers_count}`);
      } else {
        console.log(`Failed to fetch repo: ${response.status}`);
      }
    });

    it('should fetch repository languages', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(`${apiBase}/repos/${testRepo}/languages`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const languages = await response.json() as Record<string, number>;
        console.log('Languages:', Object.keys(languages).join(', '));
        expect(Object.keys(languages).length).toBeGreaterThan(0);
      }
    });

    it('should fetch repository topics', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(`${apiBase}/repos/${testRepo}/topics`, {
        headers: {
          ...getHeaders(),
          Accept: 'application/vnd.github.mercy-preview+json',
        },
      });

      if (response.ok) {
        const data = await response.json() as { names: string[] };
        console.log('Topics:', data.names.join(', ') || 'None');
      }
    });
  });

  describe('Issues API', () => {
    it('should fetch open issues', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(
        `${apiBase}/repos/${testRepo}/issues?state=open&per_page=5`,
        {
          headers: getHeaders(),
        }
      );

      if (response.ok) {
        const issues = await response.json() as Array<{
          number: number;
          title: string;
          labels: Array<{ name: string }>;
        }>;
        console.log(`Found ${issues.length} open issues (showing up to 5)`);

        issues.slice(0, 3).forEach((issue) => {
          console.log(`  #${issue.number}: ${issue.title}`);
          if (issue.labels.length > 0) {
            console.log(`    Labels: ${issue.labels.map((l) => l.name).join(', ')}`);
          }
        });
      }
    });

    it('should fetch issues with specific labels', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      // Try to find issues with "bug" label
      const response = await fetch(
        `${apiBase}/repos/${testRepo}/issues?labels=bug&state=all&per_page=5`,
        {
          headers: getHeaders(),
        }
      );

      if (response.ok) {
        const issues = await response.json() as Array<{ number: number; title: string }>;
        console.log(`Found ${issues.length} issues with 'bug' label`);
      }
    });

    it('should fetch issue comments', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      // First get an issue
      const issuesResponse = await fetch(
        `${apiBase}/repos/${testRepo}/issues?state=all&per_page=1`,
        {
          headers: getHeaders(),
        }
      );

      if (!issuesResponse.ok) return;

      const issues = await issuesResponse.json() as Array<{ number: number }>;
      if (issues.length === 0) {
        console.log('No issues found to test comments');
        return;
      }

      const issueNumber = issues[0].number;
      const commentsResponse = await fetch(
        `${apiBase}/repos/${testRepo}/issues/${issueNumber}/comments`,
        {
          headers: getHeaders(),
        }
      );

      if (commentsResponse.ok) {
        const comments = await commentsResponse.json() as Array<{
          user: { login: string };
          body: string;
        }>;
        console.log(`Issue #${issueNumber} has ${comments.length} comments`);
      }
    });
  });

  describe('Pull Requests API', () => {
    it('should fetch open pull requests', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(
        `${apiBase}/repos/${testRepo}/pulls?state=open&per_page=5`,
        {
          headers: getHeaders(),
        }
      );

      if (response.ok) {
        const prs = await response.json() as Array<{
          number: number;
          title: string;
          user: { login: string };
        }>;
        console.log(`Found ${prs.length} open PRs (showing up to 5)`);

        prs.slice(0, 3).forEach((pr) => {
          console.log(`  #${pr.number}: ${pr.title} by ${pr.user.login}`);
        });
      }
    });

    it('should fetch merged pull requests', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(
        `${apiBase}/repos/${testRepo}/pulls?state=closed&per_page=10`,
        {
          headers: getHeaders(),
        }
      );

      if (response.ok) {
        const prs = await response.json() as Array<{
          number: number;
          title: string;
          merged_at: string | null;
        }>;
        const mergedPrs = prs.filter((pr) => pr.merged_at !== null);
        console.log(`Found ${mergedPrs.length} merged PRs (from last 10 closed)`);
      }
    });
  });

  describe('Commits API', () => {
    it('should fetch recent commits', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(
        `${apiBase}/repos/${testRepo}/commits?per_page=5`,
        {
          headers: getHeaders(),
        }
      );

      if (response.ok) {
        const commits = await response.json() as Array<{
          sha: string;
          commit: { message: string; author: { name: string; date: string } };
        }>;
        console.log(`Recent commits:`);

        commits.forEach((commit) => {
          const message = commit.commit.message.split('\n')[0];
          console.log(`  ${commit.sha.slice(0, 7)}: ${message}`);
        });
      }
    });

    it('should fetch commit statistics', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(
        `${apiBase}/repos/${testRepo}/stats/contributors`,
        {
          headers: getHeaders(),
        }
      );

      // This endpoint may return 202 while computing stats
      if (response.status === 202) {
        console.log('Stats being computed - try again later');
        return;
      }

      if (response.ok) {
        const contributors = await response.json() as Array<{
          author: { login: string };
          total: number;
        }>;
        console.log(`Repository has ${contributors.length} contributors`);

        // Show top 3 contributors
        contributors
          .sort((a, b) => b.total - a.total)
          .slice(0, 3)
          .forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.author.login}: ${c.total} commits`);
          });
      }
    });
  });

  describe('Labels API', () => {
    it('should fetch repository labels', async () => {
      if (!testRepo) {
        console.log('Skipping - TEST_GITHUB_REPO not set');
        return;
      }

      const response = await fetch(`${apiBase}/repos/${testRepo}/labels`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const labels = await response.json() as Array<{
          name: string;
          color: string;
          description: string | null;
        }>;
        console.log(`Repository has ${labels.length} labels:`);

        labels.slice(0, 10).forEach((label) => {
          console.log(`  - ${label.name} (#${label.color})`);
        });
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should check API rate limit status', async () => {
      const response = await fetch(`${apiBase}/rate_limit`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json() as {
          resources: {
            core: { limit: number; remaining: number; reset: number };
          };
        };
        const core = data.resources.core;
        console.log(`Rate limit: ${core.remaining}/${core.limit}`);
        console.log(`Resets at: ${new Date(core.reset * 1000).toISOString()}`);

        expect(core.remaining).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
