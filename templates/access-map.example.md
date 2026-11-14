# Access map (example)

Copy this into a **private** repository and replace every placeholder. It records
names and locations only. Never put a secret value, token, or connection string here.
`handbook/access.md` explains how it is used.

Organization 1Password account: `<org>.1password.com`

## Groups

| Group | Covers | Group owner |
| --- | --- | --- |
| `<client>` | Every project for that client | `<person>` |
| `internal` | Internal projects | `<person>` |
| Owners only | `Production Records`: recovery copies of values we generated and cannot re-issue | `<person>` |

## Projects

The vault holds development and preview values only.

| Project | Group | Vault | Service account | Token item | Token receivers | Production values live in | Owner | Last rotated |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<repo>` | `<client>` | `<Client> - <Project>` | `<repo>-sa` (`read_items`) | in the vault / `<repo> service account token` | Cloud project `<name>` | Vercel project `<name>`, Production | `<person>` | `YYYY-MM-DD` |

Exceptions: production-grade values a project vault holds anyway.

| Project | Item | Why development needs it | Limits on the credential |
| --- | --- | --- | --- |
| `<repo>` | `DATABASE_URL` | One shared database for preview and production | Read-only application role |

## Shared services per project

| Project | Service | Team or organization | Project or resource | Machine credential (item name) | Rotate on departure |
| --- | --- | --- | --- | --- | --- |
| `<repo>` | Vercel | `<team>` | `<project>` | none in the vault | — |
| `<repo>` | Neon | `<org>` | `<project>`, development branch | `DATABASE_URL` | no |
| `<repo>` | Clerk | `<application>` | development instance | `CLERK_SECRET_KEY` | no |

## People

| Person | 1Password groups | GitHub | Vercel | Neon | Supabase | Other | Added | Removed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<person>` | `<client>` | `<team>` | Member | Member | none | | `YYYY-MM-DD` | |

## Log

| Date | Event | Projects | What was rotated | By |
| --- | --- | --- | --- | --- |
| `YYYY-MM-DD` | `<person>` removed | `<repo>` | Bootstrap token; `DATABASE_URL`; `CLERK_SECRET_KEY` | `<person>` |
