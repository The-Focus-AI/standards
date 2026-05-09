# mise and fnox setup

- install mise with: curl https://mise.run | sh
- install fnox with mise use fnox

after you install mise, and/or fnox it might not be availabe in the shell.  This is how you'd adjust that

echo "eval \"\$(/home/worker_user/.local/bin/mise activate bash)\"" >> ~/.bashrc
echo "command -v fnox >/dev/null 2>&1 && eval "$(fnox activate zsh)" >> ~/.bashrc"

# remote server setup

When manually running on a remote server, make sure you set up enable linger, make sure that you install tmux and gh and do the gh auth login in order to set up the initial connection.

- install tmux
- sudo loginctl enable-linger worker_user
- gh auth login
- setup the git user and config

# setting up pi

When installing this make sure that we have all the plugins.

- mise use node
- 'mise use npm:@earendil-works/pi-coding-agent' or 'curl -fsSL https://pi.dev/install.sh | sh'
- pi install git:github.com/offline-ant/pi-tmux
- pi install git:github.com/tmustier/pi-extensions