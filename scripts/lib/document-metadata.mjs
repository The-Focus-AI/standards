// Shared metadata contract for the CLI validator and the site renderer.
// STD-006 owns provenance and identities; STD-001 adds standard-only fields.
// Skills use their separate register, not this frontmatter schema (STD-006 §4).

import { basename } from "node:path";
import { splitFrontmatter, parseYaml } from "./yaml.mjs";
import { blocks } from "./markdown.mjs";

export const DOCUMENT_CLASSES = {
  standard: {
    dir: "standards", prefix: "STD", numberField: "standard",
    statuses: ["Draft", "In force", "Obsoleted"],
  },
  guide: { dir: "best-practices", prefix: "GDE", statuses: ["Current", "Superseded"] },
  note: { dir: "reports", prefix: "NOTE", statuses: ["Current", "Superseded"], datedFilename: true },
  decision: { dir: "architecture", prefix: "ADR", statuses: ["Proposed", "Accepted", "Superseded"] },
  prompt: { dir: "prompts", prefix: "PRM", statuses: ["Current", "Superseded"] },
  design: { dir: ".", statuses: ["Current", "Superseded"], only: ["DESIGN.md"] },
};

const REQUIRED = ["title", "kind", "issued", "author", "status"];
const STANDARD_REQUIRED = ["standard", "category", "revision", "applies-to"];
const CATEGORIES = ["Practice", "Process"];
const isText = (value) => typeof value === "string" && value.trim().length > 0;

function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function hasReplacement(body, id, file) {
  // Only an explicit forward pointer counts, not `status: Superseded`, a
  // passing mention of supersession, or an example inside a fenced block.
  // Recognize document references, paths and links without prescribing a new
  // frontmatter field. Whether a target is authoritative still needs review.
  const pointsElsewhere = (text) => {
    const refs = text.match(/\b(?:STD|GDE|NOTE|ADR|PRM|SKL)-\d{3}\b/g) ?? [];
    if (refs.length) return refs.some((ref) => ref !== id);
    const targets = [
      ...[...text.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)].map((m) => m[1]),
      ...(text.match(/https?:\/\/[^\s<>]+|[\w./-]+\.md\b/g) ?? []),
    ];
    return targets.some((target) => !target.startsWith("#") && basename(target.split(/[?#]/)[0]) !== basename(file));
  };
  const scan = (tokens) => tokens.some((token) => {
    if (token.type === "code") return false;
    if (token.type === "quote") return scan(blocks(token.text));
    const texts = token.type === "list" ? token.items
      : token.type === "table" ? token.body.map((row) => row.join(" ")) : [token.text ?? ""];
    return texts.some((text) => [...text.matchAll(/\b(?:superseded|replaced)\s+by\b\s*:?\s*(.+)/gi)]
      .some((m) => pointsElsewhere(m[1])));
  });
  return scan(blocks(body.replace(/<!--[\s\S]*?-->/g, "")));
}

export function parseDocumentMetadata(src, file, kind) {
  const spec = DOCUMENT_CLASSES[kind];
  const errors = [];
  let yaml, body;
  try {
    ({ yaml, body } = splitFrontmatter(src, file));
  } catch {
    return { meta: {}, body: "", id: null, errors: ["no frontmatter. STD-006 §3.1 requires title, kind, issued, author, status."] };
  }
  const meta = parseYaml(yaml);
  const requireText = (key, ref) => {
    if (meta[key] === undefined || meta[key] === null || meta[key] === "") {
      errors.push(`missing frontmatter: ${key} (${ref})`);
    } else if (!isText(meta[key])) {
      errors.push(`frontmatter ${key} must be nonempty text (${ref})`);
    }
  };
  for (const key of REQUIRED) requireText(key, "STD-006 §3.1");
  if (kind === "standard") {
    for (const key of STANDARD_REQUIRED) requireText(key, "STD-001 §3.18");
    if (meta.category && !CATEGORIES.includes(meta.category)) {
      errors.push(`unknown category "${meta.category}" (expected ${CATEGORIES.join(" | ")}; STD-001 §3.17)`);
    }
  }
  if (meta.kind && meta.kind !== kind) {
    errors.push(`kind is "${meta.kind}" but ${spec.dir}/ holds ${kind} documents (STD-006 §4)`);
  }
  if (meta.status && !spec.statuses.includes(meta.status)) {
    errors.push(`unknown status "${meta.status}" (expected ${spec.statuses.join(" | ")}; STD-006 §4)`);
  }
  if (kind === "note") requireText("verified", "STD-006 §3.3");
  for (const key of ["issued", "verified"]) {
    if (meta[key] !== undefined && !isDate(meta[key])) {
      errors.push(`${key} must be a valid YYYY-MM-DD date (STD-006 §3.1, §3.3)`);
    }
  }

  const name = basename(file);
  let id = null;
  if (spec.prefix) {
    const field = spec.numberField ?? "number";
    if (kind !== "standard") requireText(field, "STD-006 §3.10");
    const num = meta[field];
    if (isText(num) && /^\d{3}$/.test(num)) id = `${spec.prefix}-${num}`;
    else if (num !== undefined && num !== null) {
      errors.push(`${field} must be three digits (STD-006 §3.10)`);
    }
    const named = name.match(new RegExp(`^${spec.prefix}-(\\d{3})-(.+)\\.md$`));
    if (!named) errors.push(`filename must be ${spec.prefix}-nnn-slug.md (STD-006 §3.10)`);
    else if (num && named[1] !== num) {
      errors.push(`filename says ${spec.prefix}-${named[1]} but ${field} is "${num}" (STD-006 §3.10)`);
    }
    if (spec.datedFilename) {
      const dated = name.match(/^NOTE-\d{3}-(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
      if (!dated || !isDate(dated[1])) {
        errors.push("note filename must be NOTE-nnn-YYYY-MM-DD-slug.md with a valid date (STD-006 §3.4)");
      } else if (isDate(meta.issued) && dated[1] !== meta.issued) {
        errors.push(`note filename date ${dated[1]} must match issued "${meta.issued}" (STD-006 §3.4)`);
      }
    }
  } else if (!spec.only.includes(name)) {
    errors.push(`filename must be ${spec.only.join(" | ")} (STD-006 §4)`);
  }

  if (meta.status === "Superseded" && !hasReplacement(body, id, file)) {
    errors.push("superseded but names no replacement: name the document or link that superseded or replaced it (STD-006 §3.7)");
  }
  return { meta, body, id, errors };
}

// Prefixes are part of the identity: STD-001 and GDE-001 are not duplicates.
// Both callers run this before a corpus can be accepted or pages overwritten.
export function duplicateIdentityErrors(documents) {
  const seen = new Map();
  for (const { id, source } of documents) {
    if (!id) continue;
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id).push(source);
  }
  return [...seen].filter(([, paths]) => paths.length > 1)
    .map(([id, paths]) => `duplicate identity ${id} is used by ${paths.join(" and ")} (STD-006 §3.11)`);
}
