# Claude Code GitHub Actions Setup Guide

This guide walks you through setting up Claude Code GitHub Actions for automated code reviews, PR management, and issue triage in your repository.

## Overview

The Claude Code GitHub Actions provide:

- **Automated Code Reviews**: Thorough code analysis on every PR
- **Interactive Assistant**: Respond to `@claude` mentions in issues and PRs
- **Issue Triage**: Automatic analysis and categorization of new issues
- **PR Management**: Validation and quality checks for pull requests
- **Documentation Sync**: Automatic documentation updates when code changes

## Prerequisites

1. **Repository Admin Access**: You must be a repository admin to configure secrets
2. **Anthropic API Key**: Get your API key from [Anthropic Console](https://console.anthropic.com/)

## Setup Instructions

### Step 1: Configure Repository Secrets

Navigate to your repository's Settings → Secrets and variables → Actions, then add:

#### Required Secrets

- **`ANTHROPIC_API_KEY`**: Your Anthropic API key from the console

> **Note**: The workflows use the default `GITHUB_TOKEN` which is automatically provided by GitHub Actions. No additional GitHub App setup is required.

#### Optional Secrets (for cloud providers)

If using AWS Bedrock:
- **`AWS_ROLE_TO_ASSUME`**: ARN of the IAM role for OIDC authentication

If using Google Vertex AI:
- **`GCP_WORKLOAD_IDENTITY_PROVIDER`**: Workload Identity Provider
- **`GCP_SERVICE_ACCOUNT`**: Service account email

### Step 2: Verify Workflows

The following workflows are now configured:

1. **`claude-assistant.yml`**: Interactive assistant for @claude mentions
2. **`claude-code-review.yml`**: Automated code reviews on PRs
3. **`claude-issue-triage.yml`**: Issue analysis and categorization
4. **`claude-pr-management.yml`**: PR validation and quality checks
5. **`claude-documentation-sync.yml`**: Documentation updates

### Step 3: Test the Setup

1. **Test Interactive Assistant**:
   - Create a new issue or PR
   - Add a comment with `@claude Please help me with this`
   - Claude should respond with analysis and suggestions

2. **Test Automated Review**:
   - Open a new pull request
   - Check that the automated review workflow runs
   - Verify that Claude posts a code review comment

3. **Test Issue Triage**:
   - Create a new issue
   - Check that Claude analyzes and categorizes it automatically

## Usage Examples

### Interactive Commands

```
@claude Can you review this function and suggest improvements?
@claude Please implement error handling for this API call
@claude What's the best way to structure this component?
@claude Can you help me write tests for this feature?
```

### Automated Features

- **Code Reviews**: Automatic analysis of all PRs to main branch
- **Issue Triage**: Categorization and priority assessment of new issues
- **Documentation Sync**: Updates to docs when code changes
- **PR Validation**: Quality checks and compliance verification

## Security Considerations

⚠️ **Important Security Notes**:

- Never commit API keys to your repository
- Review Claude's suggestions before merging
- The workflows use minimal required permissions
- All API calls are made from GitHub's secure runners

## Customization

### Modifying Tool Access

Edit the `allowed_tools` parameter in workflow files to customize what Claude can do:

```yaml
allowed_tools: "Bash(pnpm install),Bash(pnpm build),Bash(pnpm test),Edit,Write,View"
```

### Custom Instructions

Add project-specific instructions in the `custom_instructions` parameter:

```yaml
custom_instructions: |
  Always use Svelte 5 runes syntax.
  Follow the patterns in CLAUDE.md.
  Run pnpm commands instead of npm.
```

### Trigger Phrases

Change the trigger phrase from `@claude` to something else:

```yaml
trigger_phrase: "/claude"
```

## Cost Optimization

### GitHub Actions Costs
- Workflows run on GitHub-hosted runners
- Each workflow consumes GitHub Actions minutes
- See [GitHub's billing documentation](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions)

### API Costs
- Each Claude interaction consumes API tokens
- Token usage varies by task complexity
- Set appropriate `timeout_minutes` to prevent runaway workflows
- Use `max_turns` to limit conversation length

### Cost Optimization Tips
- Use specific commands to reduce API calls
- Configure appropriate timeouts
- Use GitHub's concurrency controls for parallel runs
- Monitor usage in the Anthropic Console

## Troubleshooting

### Claude Not Responding to @claude

1. Verify workflows are enabled in Actions tab
2. Ensure `ANTHROPIC_API_KEY` is set in repository secrets
3. Confirm the comment contains `@claude` (not `/claude`)
4. Check that the repository has Actions enabled

### Workflow Failures

1. Check workflow logs in the Actions tab
2. Verify all required secrets are set
3. Check API key permissions and quotas
4. Ensure the GitHub App has necessary permissions

### Authentication Errors

1. Verify API key is valid in Anthropic Console
2. Check that secrets are named correctly
3. Ensure the repository has proper permissions for GitHub Actions

## Advanced Configuration

### Using AWS Bedrock

Update workflows to use Bedrock instead of direct API:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
    aws-region: us-west-2

- uses: anthropics/claude-code-action@beta
  with:
    use_bedrock: "true"
    anthropic_model: "anthropic.claude-3-7-sonnet-20250219-beta:0"
```

### Using Google Vertex AI

Update workflows to use Vertex AI:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

- uses: anthropics/claude-code-action@beta
  with:
    use_vertex: "true"
    anthropic_model: "claude-3-7-sonnet@20250219"
```

## Support

For issues with the GitHub Actions:
- Check the [Claude Code Action repository](https://github.com/anthropics/claude-code-action)
- Review the [official documentation](https://docs.anthropic.com/en/docs/claude-code/github-actions)
- Contact support through the Anthropic Console

## Next Steps

1. **Monitor Usage**: Keep an eye on API usage and GitHub Actions minutes
2. **Customize Workflows**: Adjust the workflows to match your team's needs
3. **Train Your Team**: Share this guide with team members
4. **Iterate**: Refine the setup based on real-world usage

Your Claude Code GitHub Actions are now ready to enhance your development workflow!