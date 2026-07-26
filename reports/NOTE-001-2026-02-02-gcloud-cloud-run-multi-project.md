---
number: "001"
title: "gcloud Cloud Run Deployments: Multi-Project Configuration Guide"
date: 2026-02-02
topic: gcloud-multi-project
recommendation: gcloud configurations with direnv
version_researched: gcloud CLI 500+
canonical_standard: best-practices/GDE-005-gcp-deployment.md
source_repo: foundtain-creek
use_when:
  - Working with multiple GCP projects from a single development machine
  - Deploying Cloud Run services to different environments (dev, staging, prod)
  - Managing client projects or multi-tenant architectures
  - Automating deployments in CI/CD pipelines across projects
avoid_when:
  - Single project with no need for environment switching
  - Using infrastructure-as-code tools like Terraform exclusively
  - Projects requiring complex cross-project permissions (consider dedicated service accounts)
project_context:
  language: bash/shell
  relevant_dependencies: [gcloud CLI, direnv, Cloud Run]
kind: note
author: W. Schenk
status: Current
issued: "2026-02-02"
verified: "2026-02-02"
---

> **Canonical standard:** Prefer `best-practices/GDE-005-gcp-deployment.md`. That doc
> adapts this research to TheFocus.AI conventions (mise `[env]` instead of
> direnv; Fountain Creek Cloud Run + qbsync App Engine as references).
> This file remains the longer background report.

## Summary

Managing multiple Google Cloud projects from a single workstation requires careful configuration management to avoid deploying to the wrong project. The gcloud CLI provides named configurations as the primary mechanism for managing multiple project contexts, with each configuration storing account credentials, project IDs, default regions, and compute zones[1]. The recommended approach combines gcloud configurations with environment-based automation using tools like direnv for seamless context switching[2].

Cloud Run deployments across multiple projects require understanding both the configuration management layer and the deployment commands themselves. The `gcloud run deploy` command accepts explicit `--project` and `--region` flags that override any active configuration, providing flexibility for scripted deployments[3]. For cross-project image access, proper IAM permissions must be granted to the Cloud Run service agent to read from Artifact Registry in other projects[4].

The modern best practice for multi-project setups involves: (1) creating named configurations for each project/environment, (2) using direnv for automatic context switching based on working directory, (3) leveraging service account impersonation for elevated permissions without managing key files, and (4) using explicit `--project` flags in CI/CD pipelines for clarity and safety[5][6].

## Philosophy & Mental Model

The gcloud CLI operates with a layered configuration system where values can be set at multiple levels with clear precedence rules[7]:

1. **Command-line flags** (highest priority) - `--project=my-project`
2. **Environment variables** - `CLOUDSDK_CORE_PROJECT=my-project`
3. **Active configuration** - Set via `gcloud config set project my-project`
4. **Default configuration** (lowest priority)

Think of configurations as "profiles" or "contexts" - each one encapsulates everything needed to work with a specific project: credentials, project ID, region, and zone. When you activate a configuration, all subsequent commands use those settings unless explicitly overridden.

**Key Concept: The "Wrong Project" Problem**

Running destructive commands in the wrong project is a common and dangerous mistake. The configuration system exists to prevent this by making context explicit. The mental model should be: "Always know which configuration is active before running commands."[8]

**Service Accounts vs User Accounts**

- **User accounts** (`gcloud auth login`) are for interactive development
- **Service accounts** are for automation and CI/CD
- **Service account impersonation** allows users to temporarily assume service account permissions without managing key files - this is the preferred pattern for elevated access[9]

## Setup

### Step 1: Install gcloud CLI

```bash
# macOS with Homebrew
brew install --cask google-cloud-sdk

# Or download directly
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize (creates your first configuration)
gcloud init
```

### Step 2: Create Named Configurations for Each Project

```bash
# Create a configuration for development
gcloud config configurations create dev
gcloud config set project my-project-dev-123456
gcloud config set account dev-user@example.com
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a

# Create a configuration for production
gcloud config configurations create prod
gcloud config set project my-project-prod-789012
gcloud config set account prod-user@example.com
gcloud config set compute/region us-east1
gcloud config set compute/zone us-east1-b

# Create a configuration for a client project
gcloud config configurations create client-acme
gcloud config set project acme-corp-456789
gcloud config set account contractor@example.com
gcloud config set compute/region europe-west1
```

### Step 3: Authenticate Each Configuration

```bash
# Switch to configuration and authenticate
gcloud config configurations activate dev
gcloud auth login

gcloud config configurations activate prod
gcloud auth login

# Also set up Application Default Credentials (for libraries)
gcloud auth application-default login
```

### Step 4: Set Up direnv for Automatic Switching

```bash
# Install direnv
brew install direnv

# Add to shell (bash)
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc

# Or zsh
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc

# Reload shell
source ~/.bashrc  # or ~/.zshrc
```

### Step 5: Create .envrc Files in Project Directories

```bash
# In your dev project directory
cd ~/projects/my-app-dev
echo 'export CLOUDSDK_ACTIVE_CONFIG_NAME=dev' > .envrc
direnv allow

# In your prod project directory
cd ~/projects/my-app-prod
echo 'export CLOUDSDK_ACTIVE_CONFIG_NAME=prod' > .envrc
direnv allow

# Optional: Also set ADC for client libraries
cat > .envrc << 'EOF'
export CLOUDSDK_ACTIVE_CONFIG_NAME=dev
export GOOGLE_CLOUD_PROJECT=my-project-dev-123456
EOF
direnv allow
```

## Core Usage Patterns

### Pattern 1: Deploy to Currently Active Project

Use this when your configuration is already set to the target project.

```bash
# Verify active configuration first (always!)
gcloud config configurations list

# Deploy from source code
gcloud run deploy my-service \
  --source . \
  --region us-central1 \
  --allow-unauthenticated

# Deploy from container image
gcloud run deploy my-service \
  --image us-central1-docker.pkg.dev/my-project/repo/my-image:latest \
  --region us-central1
```

### Pattern 2: Deploy to Explicit Project (Override Configuration)

Use this in scripts and CI/CD where you want explicit control regardless of the active configuration.

```bash
# Always specify project and region explicitly
gcloud run deploy my-service \
  --project my-project-prod-789012 \
  --region us-east1 \
  --image us-central1-docker.pkg.dev/my-project-prod-789012/repo/my-image:v1.2.3 \
  --no-allow-unauthenticated

# Deploy from source with explicit project
gcloud run deploy my-service \
  --source . \
  --project my-project-staging \
  --region us-central1 \
  --set-env-vars="ENV=staging,LOG_LEVEL=debug"
```

### Pattern 3: Deploy Image from Different Project

When your container image lives in a different project's Artifact Registry.

```bash
# First, grant permission to the target project's service agent
# (Run this once from the source project)
gcloud projects add-iam-policy-binding SOURCE_PROJECT_ID \
  --member="serviceAccount:service-TARGET_PROJECT_NUMBER@serverless-robot-prod.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"

# Then deploy the image to the target project
gcloud run deploy my-service \
  --project TARGET_PROJECT_ID \
  --region us-central1 \
  --image us-central1-docker.pkg.dev/SOURCE_PROJECT_ID/repo/my-image:latest
```

### Pattern 4: Use Service Account Impersonation

Deploy using a service account's permissions without managing key files.

```bash
# For a single command
gcloud run deploy my-service \
  --source . \
  --region us-central1 \
  --impersonate-service-account=deploy-sa@my-project.iam.gserviceaccount.com

# Set as default for all commands in this session
gcloud config set auth/impersonate_service_account deploy-sa@my-project.iam.gserviceaccount.com

# Or via environment variable
export CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT=deploy-sa@my-project.iam.gserviceaccount.com
gcloud run deploy my-service --source . --region us-central1
```

### Pattern 5: Quick Configuration Switch with Aliases

Add to your shell configuration for rapid switching.

```bash
# Add to ~/.bashrc or ~/.zshrc
alias gcp-dev='gcloud config configurations activate dev && echo "Switched to DEV"'
alias gcp-prod='gcloud config configurations activate prod && echo "Switched to PROD"'
alias gcp-staging='gcloud config configurations activate staging && echo "Switched to STAGING"'

# Show current context in prompt (optional)
alias gcp-whoami='gcloud config configurations list --filter="is_active=true" --format="value(name)"'
```

## Anti-Patterns & Pitfalls

### Don't: Deploy Without Verifying Context

```bash
# BAD: No verification before destructive command
gcloud run deploy production-api --source . --region us-central1
```

**Why it's wrong:** You might be deploying to dev, staging, or a client's project without realizing it. This can cause outages or data corruption.

### Instead: Always Verify Before Deploy

```bash
# GOOD: Verify context first
gcloud config list project
gcloud run deploy production-api --source . --region us-central1

# BETTER: Use explicit project flag
gcloud run deploy production-api \
  --source . \
  --region us-central1 \
  --project my-production-project
```

---

### Don't: Use Service Account Key Files

```bash
# BAD: Downloading and using key files
gcloud iam service-accounts keys create key.json \
  --iam-account=deploy-sa@my-project.iam.gserviceaccount.com

export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
gcloud run deploy ...
```

**Why it's wrong:** Key files are persistent credentials that pose a high security risk if exposed. They don't expire and can be used from anywhere.

### Instead: Use Service Account Impersonation

```bash
# GOOD: Use impersonation (short-lived tokens, requires prior auth)
gcloud run deploy my-service \
  --source . \
  --region us-central1 \
  --impersonate-service-account=deploy-sa@my-project.iam.gserviceaccount.com
```

---

### Don't: Use Generic Configuration Names

```bash
# BAD: Vague names
gcloud config configurations create config1
gcloud config configurations create config2
```

**Why it's wrong:** You'll forget what each configuration is for, leading to mistakes.

### Instead: Use Descriptive Configuration Names

```bash
# GOOD: Clear, descriptive names
gcloud config configurations create acme-corp-prod
gcloud config configurations create acme-corp-staging
gcloud config configurations create personal-experiments
```

---

### Don't: Hardcode Project IDs in Scripts

```bash
# BAD: Hardcoded values scattered throughout scripts
gcloud run deploy service --project my-project-123456 --region us-central1
gcloud pubsub topics create topic --project my-project-123456
gcloud storage buckets create gs://bucket --project my-project-123456
```

**Why it's wrong:** Hard to maintain, easy to miss when changing projects, and violates DRY.

### Instead: Use Variables or Environment

```bash
# GOOD: Centralized configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project)}"
REGION="${CLOUDSDK_COMPUTE_REGION:-us-central1}"

gcloud run deploy service --project "$PROJECT_ID" --region "$REGION"
gcloud pubsub topics create topic --project "$PROJECT_ID"
gcloud storage buckets create "gs://bucket-$PROJECT_ID" --project "$PROJECT_ID"
```

---

### Don't: Forget to Allow direnv Changes

```bash
# BAD: Creating .envrc but forgetting to allow
cd ~/projects/new-client
echo 'export CLOUDSDK_ACTIVE_CONFIG_NAME=new-client' > .envrc
# Forgot: direnv allow
gcloud run deploy ...  # Uses wrong configuration!
```

**Why it's wrong:** direnv blocks unapproved .envrc files for security. Without `direnv allow`, your environment won't switch.

### Instead: Always Run direnv allow

```bash
# GOOD: Complete the setup
cd ~/projects/new-client
echo 'export CLOUDSDK_ACTIVE_CONFIG_NAME=new-client' > .envrc
direnv allow
gcloud config configurations list  # Verify switch happened
```

## Why This Choice

### Decision Criteria

| Criterion | Weight | How gcloud Configurations Scored |
|-----------|--------|----------------------------------|
| Safety (prevent wrong-project deploys) | High | Excellent with direnv auto-switching |
| Ease of setup | Medium | Good - built into gcloud CLI |
| CI/CD compatibility | High | Excellent with explicit flags |
| Cross-project support | High | Good with IAM and impersonation |
| Team adoption | Medium | Good - standard Google tooling |
| Learning curve | Low | Low - straightforward commands |

### Key Factors

- **Built-in Solution:** gcloud configurations are part of the standard SDK, requiring no additional tools for basic functionality.
- **Layered Override System:** The precedence rules (flags > env vars > config) allow flexibility for both interactive use and automation.
- **direnv Integration:** Automatic context switching based on directory prevents the "deployed to wrong project" class of errors.
- **Service Account Impersonation:** Modern security pattern that eliminates the need for long-lived credentials.

## Alternatives Considered

### Terraform with Google Provider

- **What it is:** Infrastructure as Code tool that manages Cloud Run services declaratively
- **Why not chosen:** Better suited for infrastructure provisioning than application deployments; requires maintaining state files; learning curve for teams unfamiliar with IaC
- **Choose this instead when:**
  - You're managing complex infrastructure beyond Cloud Run
  - You need version-controlled, reviewable infrastructure changes
  - Multiple team members need to manage infrastructure consistently
- **Key tradeoff:** More overhead but better for infrastructure management; many teams use Terraform for infrastructure and gcloud CLI for application deployments

### Cloud Deploy

- **What it is:** Google's managed continuous delivery service for GKE and Cloud Run
- **Why not chosen:** Additional service to manage; better for complex release strategies with approvals and canary deployments
- **Choose this instead when:**
  - You need managed release pipelines with approvals
  - Deploying to multiple regions/projects as part of a promotion workflow
  - You want built-in rollback and canary deployment support
- **Key tradeoff:** More features but additional service cost and complexity

### GitHub Actions with Workload Identity Federation

- **What it is:** Keyless authentication from GitHub Actions to GCP using OIDC tokens
- **Why not chosen:** Specific to GitHub Actions; requires initial setup of identity pools
- **Choose this instead when:**
  - Using GitHub Actions for CI/CD
  - You want to eliminate service account keys entirely
  - Deploying across multiple projects from centralized workflows
- **Key tradeoff:** More secure than keys but requires upfront identity federation setup[10]

### Single Project with Environments (Labels/Tags)

- **What it is:** Using one project with separate Cloud Run services for each environment
- **Why not chosen:** Doesn't provide true isolation; harder to manage permissions; billing is combined
- **Choose this instead when:**
  - Small projects with minimal isolation requirements
  - Cost constraints prevent multiple projects
  - Single team managing all environments
- **Key tradeoff:** Simpler setup but weaker security boundaries

## Caveats & Limitations

- **Configuration Sync:** Configurations are stored locally in `~/.config/gcloud`. They don't sync across machines. Consider documenting your configuration setup or scripting it for new machine setup.

- **direnv Security:** direnv blocks unapproved `.envrc` files by design. After `git pull` brings in changes to `.envrc`, you must run `direnv allow` again. This can trip up team members.

- **IAM Propagation Delay:** When granting cross-project permissions (e.g., for reading images from another project's Artifact Registry), changes can take up to 5 minutes to propagate[11].

- **Service Account Impersonation Prerequisites:** The IAM Credentials API must be enabled, and the impersonating user needs the Service Account Token Creator role on the target service account.

- **ADC vs gcloud Auth:** `gcloud auth login` and `gcloud auth application-default login` are separate. Client libraries (Python, Node.js, etc.) use ADC, while the gcloud CLI uses its own credentials. You may need both.

- **Configuration Per-Terminal:** The `CLOUDSDK_ACTIVE_CONFIG_NAME` environment variable only affects the current terminal session. Other terminals retain their previous configuration.

- **No Built-in Configuration Validation:** gcloud doesn't validate that a configuration points to a valid project or that the account has access. You'll only discover issues when running commands.

## Quick Reference

### Common Environment Variables

| Variable | Purpose |
|----------|---------|
| `CLOUDSDK_ACTIVE_CONFIG_NAME` | Set active configuration for current shell |
| `CLOUDSDK_CORE_PROJECT` | Override project |
| `CLOUDSDK_COMPUTE_REGION` | Override default region |
| `CLOUDSDK_COMPUTE_ZONE` | Override default zone |
| `CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT` | Set impersonation default |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to ADC file |
| `GOOGLE_CLOUD_PROJECT` | Project for client libraries |

### Essential Commands

```bash
# List all configurations
gcloud config configurations list

# Show active config properties
gcloud config list

# Create new configuration
gcloud config configurations create NAME

# Switch configuration
gcloud config configurations activate NAME

# Set property in active config
gcloud config set project PROJECT_ID
gcloud config set compute/region REGION

# Deploy with explicit project
gcloud run deploy SERVICE --project PROJECT --region REGION --source .

# Check which project is active
gcloud config get-value project
```

## References

[1] [Managing gcloud CLI configurations](https://docs.cloud.google.com/sdk/docs/configurations) - Official documentation on creating, managing, and switching between named configurations

[2] [Switching Active gcloud Configurations with direnv](https://yurkol.com/articles/quick-switch-active-gcloud-config) - Tutorial on automating configuration switching with direnv

[3] [gcloud run deploy reference](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy) - Complete command reference for Cloud Run deployments

[4] [Deploying container images to Cloud Run](https://docs.cloud.google.com/run/docs/deploying) - Documentation on cross-project image deployment and IAM requirements

[5] [Service account impersonation](https://docs.cloud.google.com/docs/authentication/use-service-account-impersonation) - Official guide on using impersonation for secure credential management

[6] [Managing Multiple GCP Configurations: Environments & Best Practices](https://medium.com/google-cloud/managing-multiple-gcp-configurations-environments-best-practices-4dd00ded97c3) - Best practices for multi-environment setups

[7] [Managing gcloud CLI properties](https://cloud.google.com/sdk/docs/properties) - Documentation on property precedence and environment variable naming

[8] [Seamless switching between multiple projects using gcloud configurations](https://nakli.tech/posts/tutorials/gcloud-configurations/) - Practical guide with safety recommendations

[9] [The ONLY guide to Service Account Impersonation and ADC in GCP](https://medium.com/@deepanshu_x2/the-only-guide-to-service-account-impersonation-and-adc-in-gcp-5214d0da87f2) - Comprehensive guide on impersonation patterns

[10] [Deploy to Cloud Run with GitHub Actions](https://cloud.google.com/blog/products/devops-sre/deploy-to-cloud-run-with-github-actions) - Official blog post on Workload Identity Federation for GitHub Actions

[11] [Troubleshoot Cloud Run issues](https://docs.cloud.google.com/run/docs/troubleshooting) - Common deployment errors and solutions

[12] [Configuring Google Cloud SDK for multiple projects](https://www.the-swamp.info/blog/configuring-gcloud-multiple-projects/) - Step-by-step multi-project setup tutorial

[13] [google-github-actions/auth](https://github.com/google-github-actions/auth) - GitHub Action for authenticating to Google Cloud with WIF

[14] [Configure Workload Identity Federation with deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines) - Official documentation on WIF for CI/CD
