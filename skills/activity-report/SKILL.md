---
name: activity-report
description: >
  Pull live production usage plus git activity for a project and write a client- or
  team-ready markdown report, copied to the clipboard as rich text when a converter is
  available. Correlates error spikes against the commits that caused and fixed them.
  Use when asked about current usage, who is using what, whether anyone is using a
  feature, how prod is doing, or for a status/activity/usage writeup.
  Triggers on: "usage", "activity on the server", "who's using", "is anyone using",
  "how's prod doing", "status report", "usage report", "what's happening right now",
  "client update numbers", "adoption".
---

# Activity Report

Produce a short, interpreted report on what is actually happening in production —
product usage joined against git history — and put it on the clipboard ready to paste.

The value is **not** the numbers. It is the reading: which spikes are already fixed,
which failures are still open, which features have gone quiet, and what to do next.
A dump of counts is a failed report.

## Process

### 1. Find the instrumentation before querying anything

Do not guess where usage lives. Look, in this order:

- `README.md` / `AGENTS.md` / `CLAUDE.md` for a "what's live" section and the stack.
- The schema (`**/schema.ts`, `drizzle/`, `migrations/`, `prisma/schema.prisma`) for an
  events/usage/audit table. Grep for `usage_event`, `analytics`, `audit`, `_log`.
- App routes, to map paths back to features (`app/`, `pages/`, `src/routes/`).
- Non-DB sources if there is no events table: Plausible, Vercel analytics/logs, Cloud Run
  or App Engine logs, or the platform's own dashboards. Check the project's installed
  skills first — if one wraps the analytics source, use it rather than raw API calls.

Enumerate the event-type enum and the route list **first**. They tell you what the
product can even record, and they stop you inventing metrics that don't exist.

### 2. Connect to the real production data

Prefer the project's own MCP connection (Neon, Postgres, Supabase) over shelling out
with a connection string — no secrets in your context, no `.env` reads. If a connection
string is genuinely required, resolve it through `fnox` (see `STD-007`, and
`best-practices/GDE-003-fnox-secrets.md` for the playbook) and keep it out of the
transcript.

Read-only always. `SELECT` only. Never `UPDATE`/`DELETE`/`DROP` against prod, and never
"just to test." If a query would write, stop and ask.

Get the server's own clock in the first query (`SELECT now()`) — never assume the
report window from the local date. Report windows relative to server time.

### 3. Run the standard battery

Adapt names to the schema. Rolling windows beat calendar buckets for "right now"
questions; add a per-day series only when you need to spot a spike.

```sql
-- Pulse: is anything happening right now?
SELECT now() AS server_now,
       count(*) FILTER (WHERE created_at > now() - interval '1 hour')  AS last_1h,
       count(*) FILTER (WHERE created_at > now() - interval '24 hours') AS last_24h,
       count(*) FILTER (WHERE created_at > now() - interval '7 days')   AS last_7d,
       count(*) AS all_time,
       max(created_at) AS most_recent
FROM usage_events;

-- Shape: what kind of activity, and what has gone dead?
SELECT event_type,
       count(*) FILTER (WHERE created_at > now() - interval '24 hours') AS d1,
       count(*) FILTER (WHERE created_at > now() - interval '7 days')   AS d7,
       count(*) FILTER (WHERE created_at > now() - interval '30 days')  AS d30,
       count(*) AS total, max(created_at) AS last_seen
FROM usage_events GROUP BY 1 ORDER BY d7 DESC, total DESC;

-- People: real users vs you and your teammates
SELECT u.email,
       count(*) FILTER (WHERE e.created_at > now() - interval '7 days')  AS d7,
       count(*) FILTER (WHERE e.created_at > now() - interval '30 days') AS d30,
       count(*) AS total, max(e.created_at) AS last_active
FROM usage_events e LEFT JOIN users u ON u.id = e.user_id
GROUP BY 1 ORDER BY d30 DESC NULLS LAST;

-- Surfaces: which features get touched
SELECT path, count(*) FILTER (WHERE created_at > now() - interval '7 days') AS d7,
       count(*) FILTER (WHERE created_at > now() - interval '30 days') AS d30,
       count(*) AS total, max(created_at) AS last_seen
FROM usage_events WHERE event_type = 'page_view'
GROUP BY 1 ORDER BY d30 DESC LIMIT 25;

-- Daily series, for spotting the bad day
SELECT date_trunc('day', created_at)::date AS day,
       count(*) FILTER (WHERE event_type LIKE '%_started')   AS started,
       count(*) FILTER (WHERE event_type LIKE '%_succeeded') AS succeeded,
       count(*) FILTER (WHERE event_type LIKE '%_failed')    AS failed,
       round(sum(cost_usd)::numeric, 2) AS cost_usd
FROM usage_events WHERE created_at > now() - interval '21 days'
GROUP BY 1 ORDER BY 1 DESC;
```

Then go one level deeper on whatever runs long-lived jobs (`*_runs`, `*_jobs`,
queues). Pull **status counts, in-flight rows, and the actual error strings** —
grouped, so distinct failure modes separate out:

```sql
SELECT left(error, 90) AS err, count(*), max(started_at) AS last_seen
FROM job_runs WHERE status = 'failed' GROUP BY 1 ORDER BY 2 DESC;
```

Truncate error text (`left(..., 90)`) so distinct modes group together instead of
splintering on stack traces.

### 4. Pull git activity for the same window

Match the git window to the usage window so the two can be read side by side.

```bash
# What shipped, and when
git log --since="30 days ago" --date=short \
  --pretty=format:'%h %ad %an %s' --no-merges

# Volume by author — the trailing HEAD is required: without an explicit revision,
# shortlog reads stdin when piped and silently returns nothing.
git shortlog -sn --since="30 days ago" --no-merges HEAD

# Cadence — commits per day
git log --since="30 days ago" --date=short --pretty=format:'%ad' --no-merges \
  | sort | uniq -c | sort -k2

# Where the work went
git log --since="30 days ago" --numstat --pretty=format: --no-merges \
  | awk 'NF==3 {a[$3]+=$1+$2} END {for (f in a) print a[f], f}' \
  | sort -rn | head -20

# Deploy-ish signals: tags, and whether main is ahead of the last deploy
git log --since="30 days ago" --oneline --first-parent main
git status -sb
```

Note anything uncommitted or unpushed — a report that says "fixed" about work
sitting dirty in the working tree is wrong.

### 5. Correlate — this is the whole point

Line the failure spikes up against the commit log and classify every cluster:

- **Already fixed** — spike, then a commit that names it, then clean runs after.
  Say so explicitly and cite the short SHA. Do not let a fixed spike inflate the
  headline failure rate without that context.
- **Still open** — failures with no corresponding fix. These are the report's
  action items. Name the affected user and how many times it hit them.
- **Not yet verified** — fix committed but no successful run since. Say "unverified,"
  never "fixed."

Watch for the trap: a 7-day failure rate is often one bad hour. Always check whether
failures are spread across the window or clustered on a single day, and lead with
whichever is true.

### 6. Interpret before writing

Answer these, in the report:

- Is anything running **right now**? If not, when was the last activity and what was it?
- Which features are growing, and which have gone silent? Silence is a finding —
  a feature nobody has touched in a month is worth more attention than a busy one.
- Are the users real, or is the traffic you and your team? Separate them.
- What is the cost trend, if the events carry cost/tokens?
- What are the open failure modes, in priority order?

### 7. Deliver

Write the markdown to a scratch path first, then put it on the clipboard:

```bash
~/bin/mdcopy /path/to/report.md
```

`mdcopy` (requires pandoc) renders markdown to rich text on the macOS clipboard —
it pastes formatted into email, Docs, or Notion. It also accepts stdin, or reads
the clipboard with no argument.

If `mdcopy` is not on the box — a Linux dev container, CI, or a fresh machine —
do not fake it. Either pipe pandoc to the platform clipboard directly, or skip the
clipboard step, say you skipped it, and hand over the markdown file path.

```bash
pandoc -f markdown -t html report.md | xclip -selection clipboard -t text/html
```

Tell the user it is on the clipboard, link the source markdown, and surface any
judgment calls you made in the framing so they can overrule you before sending.

## Report shape

Keep it to a page. Tables for numbers, prose for meaning.

```markdown
# <Project> — Activity Snapshot
*Pulled live from production (<source>), <server timestamp>*

## Headline
Two or three sentences. The single most important thing, stated plainly.
Include whether anything is running right now.

## <Primary feature>
| | 24h | 7d | 30d |
|---|---|---|---|
Active users, cost, and the trend.

### Failures
Fixed-and-verified vs still-open, each with the error string and the SHA.

## <Secondary feature>
Especially if it has gone quiet — quantify the silence.

## Shipped this period
Commits, authors, cadence, and which failures they resolved.

## Read
What you would do next, and why.
```

## Pitfalls

- **Never invent a feature name.** If the user asks about something ("the learnings")
  that maps to no table, route, or event type, say so, report the closest real
  surface, and ask — do not silently substitute your best guess.
- **Local clock ≠ server clock.** Always `SELECT now()`.
- **Test and seed data pollutes counts.** Filter out internal domains and known test
  accounts, or split them out as their own line. Check whether the project's test
  suite writes to prod before trusting user counts.
- **`d7` overlaps `d30`.** They are nested windows, not buckets. Label them so nobody
  adds them up.
- **A zero is a finding, not a gap.** Report "0 in the last 30 days, last activity
  2026-06-05" rather than omitting the row.
- **Don't over-claim on one data point.** One successful run after a fix is
  encouraging, not proof.
- **Client-facing framing.** If the report is going to a client who *felt* an outage,
  name it directly rather than burying it — being first to raise it reads as
  competence, glossing reads as spin.
