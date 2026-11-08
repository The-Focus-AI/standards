# The Focus AI engineering handbook

Practical guidance for building, connecting, and shipping projects. Read by task,
not by document class. The Markdown is the source; GitHub Pages publishes it from
`main` at <https://standards.thefocus.ai>.

Start with [a new project](handbook/project-setup.md), [an existing repo](handbook/update-project.md),
or [agent integration](handbook/agent-services.md). The update page includes the
copyable prompt shown on the homepage.

## Read by task

| Work | Start here |
| --- | --- |
| Projects and development | [Setup](handbook/project-setup.md), [updates](handbook/update-project.md), [cloud development](handbook/development.md) |
| Work and review | [Issues, claims, and PRs](handbook/work.md) |
| Identity and credentials | [Secrets](handbook/secrets.md), [client sign-in](handbook/sign-in.md), [service access](handbook/service-access.md) |
| Agent integration | [Services](handbook/agent-services.md), [conversations](handbook/conversations.md), [interactive views](handbook/mcp-apps.md) |
| Verification and release | [Checks, approval, deployment, and recovery](handbook/release.md) |
| Skills and handbook | [Skills](handbook/skills.md), [maintaining this handbook](handbook/maintaining.md) |

Guidance marked **Draft** remains proposed. Restructuring it does not ratify it.
Recipes provide procedures; evidence records dated observations and their limits.

## Run it

```sh
mise trust
mise install
mise run install
mise run lint
mise run test
mise run handbook:build
```

`mise run handbook:preview` serves `out/handbook/`; expose it through your cloud
workspace's managed portal. The generated site has task navigation, full-text
search, a copyable update prompt, and a skills catalog derived from the lock and
owned skill directories. `handbook.md` is its downloadable agent reading copy.

The build uses Node built-ins and the repository's small Markdown renderer.
No documentation framework, runtime service, or new package dependency is required.

## Source layout

- `handbook/`: topic pages and navigation.
- `recipes/`: platform procedures linked from their owning topics.
- `evidence/`: dated implementation records, not current policy.
- `skills/`: installable capabilities, with provenance in `VENDORED.md`.
- `templates/`: project baseline and secret-sync target example.
- `scripts/`, `tests/`: build, validation, bootstrap, and executable checks.

Deploy through the authorized GitHub Actions Pages workflow, not a workspace
upload. `mise run deploy:status` shows the configured target and recent runs.
This repository's actual verification and open operational gaps are recorded in
[docs/testing.md](docs/testing.md).
