---
name: nano-banana-videogen
description: >
  Generates video with the nano-banana CLI and Google Veo models. Use for
  text-to-video, animating an image, prompted dialogue/audio, or scene extensions
  after project tooling, credentials, and spending are authorized. Model output
  and audio controls need verification rather than assumed guarantees.
---

# Nano Banana Video Generation

Generate videos using Google Veo 3.1 models via the `nano-banana` CLI.

## Prerequisites

Read the project's agent instructions, `mise.toml`, and secret declarations.
Use its cloud workspace. Ask before adding tools, provisioning keys, or making
billable calls. Loading this skill does not authorize any of those actions.

Published `@the-focus-ai/nano-banana` **1.0.10** was source-checked against
commit `42dbef71bbf9dfa3aeb6721b7c3adee4adf98573` on 2026-10-30; its
`package.json` and `cli.ts` match the npm tarball. Provider calls were not tested.
If missing, propose this **optional, approval-gated** project pin, plus any
missing Node/fnox/1Password CLI through mise:

```sh
mise use --pin npm:@the-focus-ai/nano-banana@1.0.10
```

After installation, inspect the version declaration and local help without keys:

```sh
mise ls --current
mise exec -- nano-banana --help
```

This release has no `--version`. `--list-models` calls Google, and even
`--estimate-cost` requires a key before reaching its local estimate branch;
neither is the no-credential preflight. For image inputs check `command -v file`
and ask before adding it. Use trusted filenames: MIME detection shells out to
`file` without robust shell escaping.

### Secrets preflight

Before setup or writing secrets, check **each** intended `.fnox/`, `.env`,
`.env.*`, and credential path with `git check-ignore -q -- <path>` and
`git ls-files -- <path>`. Stop for tracked secret files, reporting only the
path. Preserve ignore rules; keep `.env.example` trackable and placeholder-only.

Follow `GDE-003` / `STD-007`: an approved project vault/service account,
and a person injecting `OP_SERVICE_ACCOUNT_TOKEN` into cloud secret settings.
Never request personal account credentials or persist the injected token into
`.fnox/env`, reusable images, or snapshots. A local token file is an exception.
Merge these declarations using the approved provider and vault, not duplicate
tables in an existing `fnox.toml`:

```toml
[providers.op]
type = "1password"
vault = "<project vault>"

[secrets.GEMINI_API_KEY]
provider = "op"
value = "GEMINI_API_KEY"
description = "Gemini/Veo API; managed in the project vault"
```

Once secret access is authorized, check presence without printing values:

```sh
test -n "${OP_SERVICE_ACCOUNT_TOKEN:-}"
mise exec -- fnox exec -- sh -c 'test -n "$GEMINI_API_KEY"'
```

Execute generations as `mise exec -- fnox exec -- nano-banana ...`. The bare
commands below and in the examples assume an authorized
`mise exec -- fnox exec -- bash` shell; exit it after the task. Do not use manual
key exports or plaintext `.env` setup. The CLI reads `.env` automatically, but
fnox remains the credential source here.

### Known source limitations

- `--audio` / `--no-audio` are parsed, but **not sent to the generation API**
  in 1.0.10. They do not guarantee silence or lower cost. Describe desired sound
  in the prompt, inspect the result, and use separately approved post-processing
  if silence is required.
- `--resolution 4K` is accepted, but help restricts it to preview models. Check
  current provider support rather than assuming every parsed combination works.
- Cost figures in the CLI are static estimates, not a current quote. Confirm
  price, model access, iteration budget, and permission before generation.
- A timeout can follow a submitted billable operation. Inspect available state
  before retrying, and report uncertainty rather than automatically paying again.

## Quick Reference

```bash
# Generate a video from text
nano-banana --video "A sunset over mountains, slow dolly-in, cinematic lighting"

# Animate an existing image
nano-banana --video "The character slowly turns and smiles" --file portrait.png

# A lower-resolution fast-model iteration, only within an approved budget
nano-banana --video "Quick test scene" --video-fast --resolution 720p

# Specify output path
nano-banana --video "A cat playing" --output cat-video.mp4

# Full control over settings
nano-banana --video "Dramatic reveal scene" \
  --duration 8 --aspect 16:9 --resolution 1080p --seed 42
```

## Understanding Video Requests

Before generating, clarify these video-specific aspects:

1. **Core Scene**: What's the main action or subject?
2. **Camera Movement**: Static, dolly, pan, tracking, crane?
3. **Style**: Cinematic, documentary, commercial, casual?
4. **Audio**: Dialogue? Sound effects? Ambient sounds? Music?
5. **Duration**: 4, 6, or 8 seconds?
6. **Orientation**: Landscape (16:9) or portrait (9:16)?

## The Five-Part Video Prompt Formula

Structure prompts with these elements:

```
[Camera Movement] + [Subject] + [Action] + [Environment] + [Audio/Style]
```

**Example - Weak prompt:**

```
"a person walking"
```

**Example - Strong prompt:**

```
"Slow dolly-in shot. A woman in her 30s, shoulder-length wavy black hair,
green jacket, walks confidently through a sunlit park. Golden hour lighting,
warm color grading. Ambient sounds: birds chirping, distant traffic.
Cinematic, aspirational mood. No subtitles, no text overlay."
```

## Workflow

### Step 1: Craft the Prompt

Use the [prompting-guide.md](prompting-guide.md) for comprehensive guidance.

**Key principles:**

1. Start with camera movement (dolly, pan, static, tracking)
2. Describe subject in detail (appearance, wardrobe, expression)
3. Specify action with timing cues
4. Include lighting and environment
5. Add audio design (dialogue, SFX, ambient)
6. **Always end with**: "No subtitles, no text overlay, no captions"

### Step 2: Consider Cost

Check current provider pricing for the selected model and bound the number of
iterations. Do not treat historical per-second prices or the local estimate
table as a billing guarantee.

**Development workflow:**

1. Review prompts before spending on a generation
2. Use `--video-fast` when suitable and approved; inspect both image and sound
3. Use another model for the final render only if its benefit and cost justify it

### Step 3: Generate

```bash
nano-banana --video "your detailed prompt here"
```

Generation takes **2-4 minutes**. Progress is shown in the terminal.

### Step 4: Iterate

If the result isn't right:

1. **Refine camera movement** - Be more explicit (e.g., "slow dolly-in over 8 seconds")
2. **Add negative guidance** - Describe what to avoid
3. **Simplify** - Focus on one main action per clip
4. **Try different duration** - 4s or 6s may work better for quick actions

## Commands

### Text-to-Video

```bash
nano-banana --video "<prompt>"
```

### Image-to-Video (Animation)

```bash
nano-banana --video "<motion description>" --file input-image.png
```

The motion description should describe how the image should animate:

- "The character slowly turns their head and smiles"
- "The scene comes alive with subtle wind movement"
- "Zoom out to reveal the full landscape"

### Options

| Option | Description | Default |
| -------- | ------------- | --------- |
| `--video` | Enable video mode | (required) |
| `--video-model <name>` | Veo model to use | veo-3.1-generate-001 |
| `--video-fast` | Use fast/cheap model | (premium model) |
| `--duration <sec>` | 4, 6, or 8 seconds | 8 |
| `--aspect <ratio>` | 16:9 or 9:16 | 16:9 |
| `--resolution <res>` | 720p / 1080p; 4K needs a supported preview model | 1080p |
| `--audio`, `--no-audio` | Parsed but not forwarded to API in 1.0.10; do not rely on them | - |
| `--seed <number>` | Reproducibility seed | (random) |
| `--output <file>` | Output path | output/video-<timestamp>.mp4 |
| `--file <image>` | Input image to animate | - |

1080p requires `--duration 8`; choose 720p for 4/6-second clips. Reference
images (at most three) and extensions also require 8 seconds. `--extend`
requires the prior video and its `.uri` sidecar, forces 720p, and cannot be
combined with `--file` or `--reference`. Keep sidecars private. Always choose
a fresh output filename; image-to-video's default `<input>-animated.mp4` can
overwrite a previous iteration. Availability and output duration need a real
authorized provider check; parser acceptance is not proof of support.

## Camera Movement Reference

Use these terms for precise camera control:

| Movement | Description | Example Prompt |
| ---------- | ------------- | ---------------- |
| **Static** | No movement | "Static shot on tripod. A coffee cup steaming..." |
| **Pan** | Horizontal rotation | "Slow pan left across the city skyline..." |
| **Tilt** | Vertical rotation | "Tilt down from face to hands..." |
| **Dolly In** | Camera moves closer | "Slow dolly-in from medium to close-up..." |
| **Dolly Out** | Camera moves away | "Dolly-out revealing the vast landscape..." |
| **Tracking** | Parallel to subject | "Tracking shot following character walking..." |
| **Crane** | Sweeping vertical | "Crane shot ascending from ground level..." |
| **Handheld** | Realistic shake | "Handheld camera, documentary style..." |

**Important**: Use ONE primary movement per shot. Don't combine multiple movements.

## Dialogue Formatting

For spoken dialogue, use the colon format:

```
Character description says: "Exact dialogue here."
```

**Example:**

```
"A friendly young woman, excited and cheerful, says: 'Welcome to our store!'
Standing in bright retail environment. Natural lip-sync. No subtitles."
```

**Guidelines:**

- Keep dialogue to **6-12 words** for 8 seconds
- Describe the speaker's tone and emotion
- Always add "No subtitles, no text overlay"

## Audio Design

Structure audio in layers:

1. **Dialogue** (highest priority) - Always clear
2. **Sound Effects** - Specific, timed actions
3. **Ambient** - 3-5 background elements max
4. **Music** - Lowest priority, "ducks under dialogue"

**Example:**

```
"Sound effects: Door closing at 2-second mark, footsteps on wood.
Ambient sounds: Quiet office hum, distant typing.
Background music: Soft jazz, low volume, ducks under dialogue."
```

## Best Practices

### For Better Results

1. **Front-load important info** - Camera, subject, action first
2. **Use cinematic terms** - "35mm lens", "shallow depth of field", "golden hour"
3. **Be specific about lighting** - "Soft window light from left", not just "good lighting"
4. **Describe the mood** - "Intimate", "epic", "suspenseful", "uplifting"
5. **Include negative guidance** - What to avoid

### For Image-to-Video

1. **Match the image** - Describe motion that fits what's in the image
2. **Start subtle** - Small movements work better than dramatic changes
3. **Keep lighting consistent** - Don't describe lighting changes that differ from the image

### For Consistency Across Shots

When creating multiple related videos:

1. Create a character description and reuse it exactly
2. Keep lighting style consistent
3. Use the same camera movement style family
4. Use `--seed` for more reproducible results

## Troubleshooting

### "Video generation timeout"

- Generation can take 2-4 minutes
- If persistent, try simpler prompts
- Use `--video-fast` for faster generation

### Poor quality or wrong content

- Add more specific descriptions
- Include negative guidance
- Try the premium model instead of fast

### Subtitles appearing in video

- Always include "No subtitles, no text overlay, no captions" in prompt
- Veo was trained on videos with subtitles and tends to add them

### Audio doesn't match video

- Be more specific about when sounds occur
- Use "Sound effect: X at Y-second mark"
- Simplify audio layers (fewer elements)

### Safety filter rejection

- Avoid violence, weapons, explicit content
- Rephrase ambiguous terms
- Try more generic descriptions

## Cost Optimization

```bash
# Short fast-model iteration after current price/budget approval
nano-banana --video "test prompt" --video-fast --resolution 720p --duration 4

# Full-duration fast-model review
nano-banana --video "test prompt" --video-fast

# Final render only if authorized
nano-banana --video "final prompt" --resolution 1080p
```

## Example Prompts

See the [examples/](examples/) directory for complete prompt examples:

- [cinematic-shots.md](examples/cinematic-shots.md) - Camera movements
- [dialogue-and-audio.md](examples/dialogue-and-audio.md) - Speech and sound
- [image-to-video.md](examples/image-to-video.md) - Animating images

## Verification and sources

Use local `--help` for installation checks, not a paid sample generation. After
an authorized call, verify the output exists and inspect its duration, frames,
audio, and continuity. A successful exit alone is insufficient (the launcher
can mask signal exits). Report the selected model and any unverified limits.

- [CLI parser, help, and request construction](https://github.com/The-Focus-AI/nano-banana-cli/blob/42dbef71bbf9dfa3aeb6721b7c3adee4adf98573/cli.ts)
- [Version and executable mapping](https://github.com/The-Focus-AI/nano-banana-cli/blob/42dbef71bbf9dfa3aeb6721b7c3adee4adf98573/package.json)
- [Static cost estimates, not provider quotes](https://github.com/The-Focus-AI/nano-banana-cli/blob/42dbef71bbf9dfa3aeb6721b7c3adee4adf98573/lib/cost.ts)
