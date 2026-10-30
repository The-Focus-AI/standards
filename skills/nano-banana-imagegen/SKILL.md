---
name: nano-banana-imagegen
description: >
  Generates and edits images with the nano-banana CLI and Google Gemini models.
  Use for text-to-image, single-image editing, style transfer, logos, and
  illustrations after project tooling, credentials, and spending are authorized.
---

# Nano Banana Image Generation

Generate and edit images using Google's Gemini image models via the `nano-banana` CLI.

## Prerequisites

Read the project's agent instructions, `mise.toml`, and secret declarations.
Use its cloud workspace. No install, key provisioning, or generation is implied
by loading this skill; ask before adding dependencies or making billable calls.

The published `@the-focus-ai/nano-banana` **1.0.10** package was checked against
upstream commit `42dbef71bbf9dfa3aeb6721b7c3adee4adf98573` on 2026-10-30.
Its `package.json` and `cli.ts` match the npm tarball. This verifies command
syntax/source, not current provider availability or successful generation.

If missing, propose this **optional, approval-gated** project pin (plus any
missing Node, fnox, or 1Password CLI tooling through mise):

```sh
mise use --pin npm:@the-focus-ai/nano-banana@1.0.10
```

After installation, check the declared version and local help, without keys:

```sh
mise ls --current
mise exec -- nano-banana --help
```

There is no `--version` option in this release. `--list-models` calls Google
and is **not** an offline preflight. The CLI also uses the system `file` command
for image inputs; check `command -v file` and ask before adding it if missing.

### Secrets preflight

Before setup or secret writes, check **each** intended secret path with
`git check-ignore -q -- <path>` and `git ls-files -- <path>`: `.fnox/`, `.env`,
`.env.*`, and project credential paths. Stop if a secret file is tracked;
report the path without opening it. Preserve existing ignores and keep
`.env.example` trackable with placeholders only.

Follow `GDE-003` / `STD-007` for a project-scoped vault and service account.
A person injects `OP_SERVICE_ACCOUNT_TOKEN` through cloud secret settings, not
chat, a reusable image, or a copied personal login. Do not write the injected
token to `.fnox/env`; that file is only a documented local exception.
Merge a declaration like this into the project's existing `fnox.toml`, using
the approved provider/vault/item names (these are placeholders, not keys):

```toml
[providers.op]
type = "1password"
vault = "<project vault>"

[secrets.GEMINI_API_KEY]
provider = "op"
value = "GEMINI_API_KEY"
description = "Gemini API; managed in the project vault"
```

When secret access is authorized, check resolution without printing a value:

```sh
test -n "${OP_SERVICE_ACCOUNT_TOKEN:-}"
mise exec -- fnox exec -- sh -c 'test -n "$GEMINI_API_KEY"'
```

Run a generation as `mise exec -- fnox exec -- nano-banana ...`. For the bare
`nano-banana` examples below and in the prompting guide, use an authorized
`mise exec -- fnox exec -- bash` shell, then exit it when finished. Never paste
keys into shell commands or create a plaintext `.env` as the setup shortcut.
The CLI reads `.env` automatically; fnox is still the credential source here.

## Quick Reference

```bash
# Generate a new image
nano-banana "a serene mountain landscape at sunset"

# Edit an existing image
nano-banana "add a hot air balloon to the sky" --file photo.jpg

# Specify output path
nano-banana "a minimalist logo" --output logo.png

# Use a specific model
nano-banana "detailed illustration" --model gemini-2.5-flash-image
```

## Workflow

### Step 1: Understand the Request

Before generating, clarify:

- **Subject**: What should be in the image?
- **Style**: Photorealistic, illustration, cartoon, abstract?
- **Mood**: Bright, dark, moody, cheerful?
- **Composition**: Close-up, wide shot, specific aspect ratio?
- **Use case**: Hero image, icon, social media, print?

### Step 2: Craft an Effective Prompt

See [prompting-guide.md](prompting-guide.md) for comprehensive guidance.

**Key principles:**

1. Be specific and descriptive
2. Include style references
3. Specify what you DON'T want
4. Describe composition and framing

**Example - Weak prompt:**

```
"a cat"
```

**Example - Strong prompt:**

```
"A fluffy orange tabby cat curled up on a velvet armchair, soft afternoon sunlight streaming through a window, warm cozy interior, photorealistic style, shallow depth of field"
```

### Step 3: Generate the Image

```bash
nano-banana "your detailed prompt here"
```

Default output: `output/generated-<timestamp>.png`

### Step 4: Iterate

If the result isn't right:

1. **Refine the prompt** - Add more detail or constraints
2. **Edit the image** - Use `--file` to modify the generated image
3. **Try a different model** - Some models handle certain styles better

## Commands

### Text-to-Image Generation

```bash
nano-banana "<prompt>"
```

### Image Editing

```bash
nano-banana "<edit instruction>" --file input-image.png
```

Edit instructions should describe the change:

- "Remove the background and replace with a gradient"
- "Add sunglasses to the person"
- "Change the sky to sunset colors"
- "Make it look like a watercolor painting"

### Options

| Option | Description |
| -------- | ------------- |
| `--file <image>` | Input image for editing |
| `--output <path>` | Custom output path |
| `--model <name>` | Specific Gemini model |
| `--flash` | Use gemini-2.5-flash-image (faster, simpler images) |
| `--prompt-file <path>` | Read prompt from file |
| `--list-models` | Query the provider for models; requires authorized API access |

The checked default image model is `gemini-3.1-flash-image-preview`; `--flash`
selects `gemini-2.5-flash-image`. Confirm model access and price before generating.
Use a fresh explicit output path for edits: the default `<input>-edited.png`
can overwrite a previous iteration. Only use trusted input filenames: this
CLI shells out to `file` for MIME detection without robust shell escaping.

## Best Practices

### For Better Results

1. **Start with composition**: Describe the layout first, then details
2. **Use artistic references**: "in the style of Studio Ghibli", "like a National Geographic photo"
3. **Specify lighting**: "golden hour lighting", "dramatic chiaroscuro", "soft diffused light"
4. **Include negative guidance**: Describe what to avoid in the prompt itself
5. **Consider aspect ratio**: The model generates square by default; describe wide/tall if needed

### For Editing

1. **Be specific about changes**: "Add a blue butterfly to the top-left corner"
2. **Preserve what works**: "Keep the background unchanged, only modify the foreground"
3. **Iterative refinement**: Make one change at a time for better control

### For Consistency

When creating multiple related images:

1. Create a style guide in your prompt
2. Use the same style descriptors across prompts
3. Reference the first image when editing subsequent ones

## Example Prompts

See the [examples/](examples/) directory for full prompt examples.

### Header/Hero Images

```
"Wide 16:9 header image for a technology blog. Clean minimalist design with
abstract geometric shapes in teal and orange. Bright white background,
editorial magazine aesthetic. No text, no dark colors, no gradients."
```

### Product Photography Style

```
"Professional product photo of a ceramic coffee mug on a marble surface.
Soft natural lighting from the left, subtle shadow, clean white background.
Commercial photography style, 4K quality, sharp focus on the product."
```

### Illustrations

```
"Whimsical children's book illustration of a fox reading a book under a
large oak tree. Soft watercolor style, warm autumn colors, gentle and
inviting mood. Simple composition with the fox as the focal point."
```

### Icons and Logos

```
"Minimalist app icon for a meditation app. Simple lotus flower symbol in
a soft purple gradient. Clean geometric design, works at small sizes,
modern and calming aesthetic."
```

## Troubleshooting

### "No image in response"

- Prompt may have triggered safety filters
- Try rephrasing with less ambiguous terms
- Check if the model supports image generation

### Poor quality results

- Add more specific style guidance
- Check the selected model's capabilities rather than assuming `--flash` is better
- Be more explicit about what you want

### Image doesn't match description

- Be more explicit about composition
- Add negative constraints ("no X, no Y")
- Try breaking complex prompts into simpler parts

## Verification and sources

Use local `--help` for syntax checks. Do not run real generation merely to test
skill installation. After an authorized request, inspect the output image and
report the model, output path, and limitations; a successful process exit is
not sufficient evidence (the launcher can mask signal exits).

- [CLI parser and help at the checked revision](https://github.com/The-Focus-AI/nano-banana-cli/blob/42dbef71bbf9dfa3aeb6721b7c3adee4adf98573/cli.ts)
- [Package and executable mapping](https://github.com/The-Focus-AI/nano-banana-cli/blob/42dbef71bbf9dfa3aeb6721b7c3adee4adf98573/package.json)
