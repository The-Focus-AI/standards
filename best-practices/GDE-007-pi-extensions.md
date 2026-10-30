---
number: "007"
title: "pi extensions"
kind: guide
issued: "2026-07-25"
author: W. Schenk
status: Current
verified: "2026-10-28"
---

> Bootstrap rules are `STD-005`; this guide locates the package configuration.

# Pi extensions

The canonical package list is `.pi/settings.json`, under `packages`. Read it
directly instead of maintaining a second list here:

```sh
node -e 'console.log(JSON.parse(require("node:fs").readFileSync(".pi/settings.json", "utf8")).packages.join("\n"))'
```

`mise.toml` declares pi. Run `mise install` to install tools; pi reads its local
package configuration on startup. The package entries currently have no
version or commit suffixes: they are declared, not revision-pinned.
