// Minimal YAML reader for the frontmatter shapes this repo actually uses:
// nested maps, scalars, flow sequences, quoted strings, `>-` block scalars,
// and `- ` block sequences of scalars.
//
// Deliberately small. If a document needs more YAML than this, that is a
// signal the frontmatter is drifting toward configuration.

export function splitFrontmatter(src, file = "document") {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: no YAML frontmatter found`);
  return { yaml: m[1], body: m[2] };
}

export function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, node: root }];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim() || /^\s*#/.test(raw)) continue;

    const indent = raw.match(/^\s*/)[0].length;
    const line = raw.trim();

    // block sequence entry: "- value"
    if (line.startsWith("- ")) {
      while (stack.length > 1 && indent < stack[stack.length - 1].indent) stack.pop();
      const holder = stack[stack.length - 1];
      if (Array.isArray(holder.node)) holder.node.push(unquote(line.slice(2).trim()));
      continue;
    }

    const km = line.match(/^([\w.-]+):\s*(.*)$/);
    if (!km) continue;
    const [, key, rest] = km;

    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].node;

    if (rest === "") {
      // could be a map or a block sequence; peek at the next meaningful line
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      const nextIsSeq = j < lines.length && lines[j].trim().startsWith("- ");
      const node = nextIsSeq ? [] : {};
      parent[key] = node;
      stack.push({ indent, node });
      continue;
    }
    if (rest === ">-" || rest === ">" || rest === "|" || rest === "|-") {
      const buf = [];
      while (i + 1 < lines.length && (!lines[i + 1].trim() || lines[i + 1].match(/^\s*/)[0].length > indent)) {
        buf.push(lines[++i].trim());
      }
      parent[key] = buf.join(" ").trim();
      continue;
    }
    if (rest.startsWith("[")) {
      parent[key] = rest.replace(/^\[|\]$/g, "").split(",").map((s) => unquote(s.trim())).filter(Boolean);
      continue;
    }
    parent[key] = unquote(rest);
  }
  return root;
}

function unquote(v) {
  const s = v.replace(/^["']|["']$/g, "");
  if (s === "null" || s === "~") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  return s;
}

export const getPath = (obj, path) =>
  path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
