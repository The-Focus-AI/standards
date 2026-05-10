# mise and fnox setup

Install mise:

```bash
curl https://mise.run | sh
```

Install fnox:

```bash
mise use fnox
```

After installing mise and/or fnox, they may not be available in the current shell.
Add activation to your shell config:

```bash
# bash
echo 'eval "$(/home/worker_user/.local/bin/mise activate bash)"' >> ~/.bashrc

# zsh
echo 'eval "$(/home/worker_user/.local/bin/mise activate zsh)"' >> ~/.zshrc
echo 'command -v fnox >/dev/null 2>&1 && eval "$(fnox activate zsh)"' >> ~/.zshrc
```

# remote server setup

When manually running on a remote server:

- `sudo loginctl enable-linger worker_user`
- `gh auth login`
- Set up git user and config:

  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

# setting up pi

## Install pi (project-level)

Add Node and pi to the project's mise.toml:

```bash
mise use node
mise use npm:@earendil-works/pi-coding-agent
```

Alternative: install pi globally with the install script:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

## Project-local pi configuration

Create `.pi/settings.json` to keep pi resources project-local:

```json
{
  "npmCommand": ["mise", "exec", "node", "--", "npm"],
  "sessionDir": ".pi/sessions"
}
```

- **`npmCommand`** — Routes all pi npm operations through mise so they use the project's Node version.
- **`sessionDir`** — Stores sessions inside the project instead of `~/.pi/agent/sessions/`.

Add to `.gitignore` so per-developer artifacts aren't committed:

```gitignore
.pi/sessions/
.pi/npm/
.pi/git/
```

Note: `.pi/settings.json` itself **should be committed** so the team shares the same pi configuration.

## Install pi packages (project-local)

Always use `-l` (local) to install packages at the project level:

```bash
pi install -l git:github.com/offline-ant/pi-tmux
```

This writes to `.pi/settings.json` and installs to `.pi/git/`. Teammates who
clone the repo and run pi will have packages auto-installed on startup.

# tmux setup

Add to `~/.tmux.conf`:

```tmux
set -g mouse on
set -g extended-keys on
set -g extended-keys-format csi-u
```

- **`mouse on`** — Enables mouse wheel scrolling, click/drag on scroll bars,
  pane resizing, and window switching via mouse. Pi output is scrollable
  with the mouse wheel.
- **`extended-keys on` + `csi-u`** — Forwards modified keys like
  `Shift+Enter` and `Ctrl+Enter` so pi can distinguish them from plain
  `Enter` (required for multi-line input and custom keybindings). Requires
  tmux 3.2+.

After updating `~/.tmux.conf`, restart tmux fully:

```bash
tmux kill-server
tmux
```

> **Tip:** With `mouse on`, tmux captures mouse events. Hold **Shift** while
> selecting text to temporarily bypass tmux's mouse handling for copy/paste.
