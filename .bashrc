# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples

# If not running interactively, don't do anything
[ -z "$PS1" ] && return

# don't put duplicate lines in the history. See bash(1) for more options
# ... or force ignoredups and ignorespace
HISTCONTROL=ignoredups:ignorespace

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# make less more friendly for non-text input files, see lesspipe(1)
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "$debian_chroot" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color) color_prompt=yes;;
esac

# uncomment for a colored prompt, if the terminal has the capability; turned
# off by default to not distract the user: the focus in a terminal window
# should be on the output of commands, not on the prompt
#force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
unset color_prompt force_color_prompt

# If this is an xterm set the title to user@host:dir
case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
    ;;
*)
    ;;
esac

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    #alias dir='dir --color=auto'
    #alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

# some more ls aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# Alias definitions.
# You may want to put all your additions into a separate file like
# ~/.bash_aliases, instead of adding them here directly.
# See /usr/share/doc/bash-doc/examples in the bash-doc package.

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
#if [ -f /etc/bash_completion ] && ! shopt -oq posix; then
#    . /etc/bash_completion
#fi
alias devbrain='~/devbrain-start.sh'
#!/bin/bash
# ============================================================================
# SWAYAM Service Management - Aliases & Commands
# Add this to your ~/.bashrc on the server (root@216.48.185.29)
# ============================================================================

# =============================================================================
# SWAYAM ALIASES - Copy everything below to ~/.bashrc
# =============================================================================

# ----------------------------------------------------------------------------
# SWAYAM QUICK COMMANDS
# ----------------------------------------------------------------------------

# Start Swayam (safe method - bypasses tsx)
alias swayam-start='cd /root/ankr-labs-nx/packages/bani && /usr/bin/node dist/server.js &'

# Start with pm2 (production)
alias swayam-pm2='pm2 start /root/ankr-labs-nx/ecosystem.bani.config.js'

# Stop Swayam
alias swayam-stop='pm2 stop bani-api 2>/dev/null; pkill -f "node.*bani.*server" 2>/dev/null; echo "✅ Swayam stopped"'

# Restart Swayam (build + restart)
alias swayam-restart='cd /root/ankr-labs-nx/packages/bani && npm run build && pm2 restart bani-api'

# Quick restart (no rebuild)
alias swayam-reload='pm2 restart bani-api'

# View logs
alias swayam-logs='pm2 logs bani-api --lines 50'
alias swayam-logs-live='pm2 logs bani-api'

# Health check
alias swayam-health='curl -s http://localhost:7777/health | jq . 2>/dev/null || curl -s http://localhost:7777/health'

# Status
alias swayam-status='pm2 show bani-api | grep -E "status|uptime|memory|restarts"'

# Build
alias swayam-build='cd /root/ankr-labs-nx/packages/bani && npm run build'

# Go to directory
alias swayam-cd='cd /root/ankr-labs-nx/packages/bani'

# ----------------------------------------------------------------------------
# OTHER SERVICES (Won't affect Swayam)
# ----------------------------------------------------------------------------

# AI Proxy
alias aiproxy-start='pm2 start ai-proxy'
alias aiproxy-stop='pm2 stop ai-proxy'
alias aiproxy-logs='pm2 logs ai-proxy --lines 30'

# Ankr Sandbox (code execution)
alias sandbox-start='pm2 start ankr-sandbox'
alias sandbox-stop='pm2 stop ankr-sandbox'
alias sandbox-logs='pm2 logs ankr-sandbox --lines 30'

# ----------------------------------------------------------------------------
# FULL STACK COMMANDS
# ----------------------------------------------------------------------------

# Start all Swayam-related services
swayam-all-start() {
    echo "🚀 Starting Swayam Stack..."
    pm2 start ai-proxy 2>/dev/null || echo "   ai-proxy already running or not configured"
    pm2 start ankr-sandbox 2>/dev/null || echo "   ankr-sandbox already running or not configured"
    pm2 start /root/ankr-labs-nx/ecosystem.bani.config.js 2>/dev/null || echo "   bani-api starting..."
    sleep 2
    echo ""
    echo "📊 Status:"
    pm2 list | grep -E "bani|ai-proxy|sandbox"
    echo ""
    swayam-health
}

# Stop all Swayam services (keeps other pm2 apps running)
swayam-all-stop() {
    echo "🛑 Stopping Swayam Stack..."
    pm2 stop bani-api 2>/dev/null
    pm2 stop ai-proxy 2>/dev/null
    pm2 stop ankr-sandbox 2>/dev/null
    echo "✅ Swayam stack stopped"
    echo ""
    echo "📊 Remaining services:"
    pm2 list
}

# Full restart with build
swayam-full-restart() {
    echo "🔄 Full Swayam Restart..."
    swayam-stop
    swayam-build
    sleep 1
    swayam-pm2
    sleep 3
    swayam-health
}

# Test WebSocket connection
swayam-test-ws() {
    echo "🧪 Testing WebSocket..."
    node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:7777/swayam');
ws.on('open', () => {
  console.log('✅ WebSocket Connected!');
  ws.send(JSON.stringify({ type: 'join', sessionId: 'test', userId: 'test', language: 'en' }));
});
ws.on('message', (d) => console.log('📨 Received:', d.toString().substring(0,100)));
ws.on('error', (e) => console.log('❌ Error:', e.message));
setTimeout(() => { ws.close(); console.log('✅ Test complete'); process.exit(0); }, 3000);
" 2>&1
}

# Show all service health
swayam-stack-health() {
    echo "📊 Swayam Stack Health Check"
    echo "============================"
    echo ""
    echo "BANI (7777):"
    curl -s http://localhost:7777/health | head -c 100 && echo "..." || echo "❌ Not responding"
    echo ""
    echo "AI-Proxy (4444):"
    curl -s http://localhost:4444/health 2>/dev/null | head -c 100 || echo "❌ Not responding"
    echo ""
    echo "Sandbox (4220):"
    curl -s http://localhost:4220/health 2>/dev/null | head -c 100 || echo "❌ Not responding"
    echo ""
    echo "Redis:"
    redis-cli ping 2>/dev/null || echo "❌ Not responding"
    echo ""
    echo "PostgreSQL:"
    pg_isready -h localhost -p 5432 2>/dev/null || echo "❌ Not responding"
}

# ----------------------------------------------------------------------------
# HELP
# ----------------------------------------------------------------------------

swayam-help() {
    echo "
🎤 SWAYAM SERVICE COMMANDS
==========================

BASIC:
  swayam-start      Start Swayam (direct node)
  swayam-pm2        Start with pm2
  swayam-stop       Stop Swayam
  swayam-restart    Rebuild & restart
  swayam-reload     Quick restart (no rebuild)
  swayam-logs       View last 50 log lines
  swayam-logs-live  Live log stream
  swayam-health     Check health endpoint
  swayam-status     Show pm2 status
  swayam-build      Build TypeScript
  swayam-cd         Go to bani directory

FULL STACK:
  swayam-all-start     Start BANI + AI-Proxy + Sandbox
  swayam-all-stop      Stop all Swayam services
  swayam-full-restart  Full rebuild & restart
  swayam-test-ws       Test WebSocket connection
  swayam-stack-health  Check all services

OTHER SERVICES:
  aiproxy-start/stop/logs
  sandbox-start/stop/logs

📍 Production: https://swayam.digimitra.guru
📍 Server: 216.48.185.29
"
}

echo "✅ Swayam aliases loaded! Type 'swayam-help' for commands."

# =============================================================================
# END OF ALIASES
# =============================================================================

# Codex CLI API Keys
source /root/.codex/env.sh
export NODE_OPTIONS="--max-old-space-size=4096"

# ANKR Aliases
source /root/.ankr/aliases.sh

# opencode
export PATH=/root/.opencode/bin:$PATH

alias e2e='ssh -i ~/.ssh/e2e root@216.48.185.29'
alias e2e='ssh -i ~/.ssh/e2e root@216.48.185.29'

# Health Check Aliases
alias health='/root/health-check.sh'
alias hc='/root/health-quick.sh'
alias health-quick='/root/health-quick.sh'
alias cleanup='/root/disk-cleanup.sh'
alias disk-cleanup='/root/disk-cleanup.sh'
alias compress-db='/root/compress-timescaledb.sh'
alias compress-maritime='/root/compress-timescale-full.sh'

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
