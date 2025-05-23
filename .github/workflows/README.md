# GitHub Workflows for Bug Detection and Fixing

This repository uses comprehensive GitHub Actions workflows to automatically detect, triage, and fix bugs. Here's how to use them:

## 🚀 Workflow Overview

### 1. **Continuous Integration (ci.yml)**
- **Triggers**: On push to main, PRs, and manual dispatch
- **Purpose**: Runs linting, type checking, tests, and builds the project
- **Features**:
  - ESLint with error reporting
  - TypeScript type checking
  - Unit test execution with coverage
  - Build verification
  - Bundle size analysis

### 2. **Code Quality and Security (code-quality.yml)**
- **Triggers**: Push to main, PRs, weekly schedule, manual dispatch
- **Purpose**: Deep security and quality analysis
- **Features**:
  - Dependency vulnerability scanning
  - Code duplication detection
  - Security scanning with Trivy and Snyk
  - CodeQL analysis
  - SonarCloud integration (requires setup)
  - Performance checks with Lighthouse

### 3. **Svelte-Specific Checks (svelte-checks.yml)**
- **Triggers**: On Svelte file changes
- **Purpose**: Svelte-specific linting and best practices
- **Features**:
  - Svelte 5 runes usage verification
  - Component complexity analysis
  - Accessibility checks
  - Anti-pattern detection
  - Performance analysis

### 4. **Auto-Fix Common Issues (auto-fix.yml)**
- **Triggers**: Manual dispatch, daily schedule
- **Purpose**: Automatically fix common code issues
- **Features**:
  - ESLint auto-fix
  - Prettier formatting
  - Import ordering
  - Unused import removal
  - Creates PRs with fixes

### 5. **Bug Triage (bug-triage.yml)**
- **Triggers**: On issue creation/edit
- **Purpose**: Automatically analyze and categorize bug reports
- **Features**:
  - Severity assessment
  - Affected area detection
  - Missing reproduction steps detection
  - Automatic labeling

### 6. **Comprehensive Bug Scan (comprehensive-bug-scan.yml)**
- **Triggers**: Manual dispatch, weekly schedule
- **Purpose**: Full system scan for all types of issues
- **Features**:
  - Aggregated report generation
  - Optional GitHub issue creation
  - All checks in one place

### 7. **PR Validation (pr-validation.yml)**
- **Triggers**: On pull request events
- **Purpose**: Validate PRs before merge
- **Features**:
  - Dangerous pattern detection
  - Test coverage verification
  - Breaking change detection
  - Bundle size comparison

## 📋 Required Setup

### 1. Basic Setup (No Additional Configuration)
These workflows will run with just the default `GITHUB_TOKEN`:
- CI checks
- Svelte checks
- PR validation
- Bug triage

### 2. Optional Integrations

#### For Enhanced Security Scanning:
```yaml
# Add to repository secrets:
SNYK_TOKEN: your-snyk-token
SONAR_TOKEN: your-sonarcloud-token
```

#### For Code Coverage:
```yaml
# Add to repository secrets:
CODECOV_TOKEN: your-codecov-token
```

## 🎯 How to Use

### Running Manual Scans
1. Go to Actions tab
2. Select "Comprehensive Bug Scan"
3. Click "Run workflow"
4. Optionally check "Create GitHub issues" to auto-create issues

### Triggering Auto-Fix
1. Go to Actions tab
2. Select "Auto-Fix Common Issues"
3. Click "Run workflow"
4. Review the created PR

### Understanding Reports
- **Check Marks (✅)**: Passing checks
- **Warning Signs (⚠️)**: Issues that need attention
- **Cross Marks (❌)**: Failing checks that block merge

## 🔧 Customization

### Adding Custom Checks
Edit the workflow files to add your own checks:

```yaml
- name: My Custom Check
  run: |
    # Your custom logic here
    echo "Running custom check..."
```

### Adjusting Thresholds
Many checks have configurable thresholds:

```yaml
# In code-quality.yml
if [ "$COMMENT_COUNT" -gt 20 ]; then  # Change 20 to your threshold
```

### Disabling Workflows
To disable a workflow, either:
1. Delete the workflow file
2. Add to the top of the workflow:
   ```yaml
   on:
     workflow_dispatch:  # Only manual trigger
   ```

## 🐛 Common Issues

### Workflow Not Running
- Check if workflows are enabled in Settings → Actions
- Verify file is in `.github/workflows/` directory
- Check YAML syntax is valid

### Security Scan Failures
- Some security tools require tokens
- Add required secrets to repository settings

### Auto-Fix Not Creating PRs
- Ensure the workflow has write permissions
- Check branch protection rules

## 📊 Metrics and Monitoring

View workflow performance:
1. Go to Actions tab
2. Click on a workflow
3. View "Usage" for execution time and status

## 🤝 Contributing

When adding new workflows:
1. Test locally with `act` if possible
2. Use descriptive names
3. Add documentation
4. Consider performance impact

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)