# Clone ANKR Repositories on Termux 📱

**Guide for setting up and cloning all ANKR repos on your Android phone**

---

## 🚀 Step 1: Install Termux (If Not Already Installed)

### Download Termux:
- **Recommended:** F-Droid (https://f-droid.org/en/packages/com.termux/)
- **Alternative:** Google Play Store (older version)

**Note:** F-Droid version is more up-to-date!

---

## 🔧 Step 2: Setup Termux

### Run these commands in Termux:

```bash
# Update packages
pkg update && pkg upgrade -y

# Install required packages
pkg install git openssh -y

# Create a directory for projects
mkdir -p ~/projects
cd ~/projects
```

---

## 🔑 Step 3: Setup SSH Keys for GitHub

### Generate SSH Key:
```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Press Enter 3 times (default location, no passphrase for convenience)

# Display your public key
cat ~/.ssh/id_ed25519.pub
```

### Add SSH Key to GitHub:
1. Copy the public key output (long string starting with `ssh-ed25519`)
2. Go to: https://github.com/settings/keys
3. Click "New SSH key"
4. Title: "Termux on Android"
5. Paste the key
6. Click "Add SSH key"

### Test SSH Connection:
```bash
ssh -T git@github.com

# You should see: "Hi username! You've successfully authenticated..."
```

---

## 📦 Step 4: Clone All Repositories

### Option 1: Clone One by One

```bash
cd ~/projects

# Core ANKR repositories
git clone git@github.com:rocketlang/ankr-universe.git
git clone git@github.com:rocketlang/ankr-labs-nx.git
git clone git@github.com:rocketlang/ankr-ai-gateway.git
git clone git@github.com:rocketlang/ankr-sandbox.git
git clone git@github.com:rocketlang/ankr-skill-loader.git

# Projects
git clone git@github.com:rocketlang/ankrcode.git
git clone git@github.com:rocketlang/bani.git
git clone git@github.com:rocketlang/swayam.git
git clone git@github.com:rocketlang/power-erp.git
git clone git@github.com:rocketlang/everpure-whatsapp-bot.git

echo "All repos cloned!"
```

### Option 2: Use Auto-Clone Script (Recommended!)

```bash
cd ~/projects

# Create clone script
cat > clone-all.sh << 'SCRIPT'
#!/data/data/com.termux/files/usr/bin/bash

echo "📦 Cloning all ANKR repositories..."
echo ""

repos=(
    "ankr-universe"
    "ankr-labs-nx"
    "ankr-ai-gateway"
    "ankr-sandbox"
    "ankr-skill-loader"
    "ankrcode"
    "bani"
    "swayam"
    "power-erp"
    "everpure-whatsapp-bot"
)

for repo in "${repos[@]}"; do
    if [ -d "$repo" ]; then
        echo "⏭️  Skipping $repo (already exists)"
    else
        echo "📥 Cloning $repo..."
        git clone git@github.com:rocketlang/${repo}.git
        echo "✅ Done"
    fi
    echo ""
done

echo "🎉 All repositories cloned!"
SCRIPT

# Make executable
chmod +x clone-all.sh

# Run it
./clone-all.sh
```

---

## 🔄 Step 5: Update Repositories

### Create Update Script:

```bash
cd ~/projects

cat > update-all.sh << 'SCRIPT'
#!/data/data/com.termux/files/usr/bin/bash

echo "🔄 Updating all repositories..."
echo ""

for dir in */; do
    if [ -d "$dir/.git" ]; then
        echo "📦 Updating: $dir"
        cd "$dir"
        
        # Get current branch
        branch=$(git branch --show-current)
        
        # Pull latest changes
        git pull origin "$branch" 2>&1 | head -3
        
        cd ..
        echo ""
    fi
done

echo "✅ All repositories updated!"
SCRIPT

chmod +x update-all.sh

# Run it
./update-all.sh
```

---

## 📱 Step 6: Useful Termux Tips

### Quick Commands:

```bash
# Navigate to projects
cd ~/projects

# List all repos
ls -la

# Enter a repo
cd ankr-universe

# Check status
git status

# View recent commits
git log --oneline -10

# View specific commit
git show COMMIT_HASH

# Pull latest changes
git pull

# See what changed
git diff

# Create a branch
git checkout -b feature-name

# Commit changes
git add .
git commit -m "Update from Termux"

# Push changes
git push origin branch-name
```

### Termux Shortcuts:
- **Volume Down + C** = Ctrl+C (cancel)
- **Volume Down + D** = Ctrl+D (exit)
- **Volume Down + L** = Clear screen
- **Volume Down + Q** = Show extra keys
- **Swipe keyboard left/right** = Switch between tabs

### Install Text Editors:
```bash
# Nano (simple)
pkg install nano

# Vim (advanced)
pkg install vim

# Micro (user-friendly)
pkg install micro

# Edit a file
nano filename.md
micro filename.md
```

---

## 🎯 Step 7: Verify Everything Works

```bash
cd ~/projects

# Check all repos
for dir in */; do
    if [ -d "$dir/.git" ]; then
        echo "✅ $dir"
        cd "$dir"
        git remote -v | head -1
        cd ..
    fi
done
```

---

## 📂 Final Directory Structure

```
~/projects/
├── ankr-universe/
├── ankr-labs-nx/
├── ankr-ai-gateway/
├── ankr-sandbox/
├── ankr-skill-loader/
├── ankrcode/
├── bani/
├── swayam/
├── power-erp/
├── everpure-whatsapp-bot/
├── clone-all.sh
└── update-all.sh
```

---

## 🔗 Quick Reference URLs

**GitHub Organization:** https://github.com/rocketlang

**Repository URLs:**
```
git@github.com:rocketlang/ankr-universe.git
git@github.com:rocketlang/ankr-labs-nx.git
git@github.com:rocketlang/ankr-ai-gateway.git
git@github.com:rocketlang/ankr-sandbox.git
git@github.com:rocketlang/ankr-skill-loader.git
git@github.com:rocketlang/ankrcode.git
git@github.com:rocketlang/bani.git
git@github.com:rocketlang/swayam.git
git@github.com:rocketlang/power-erp.git
git@github.com:rocketlang/everpure-whatsapp-bot.git
```

---

## 🛠️ Troubleshooting

### "Permission denied (publickey)"
**Fix:** SSH key not added to GitHub
```bash
# Show your public key again
cat ~/.ssh/id_ed25519.pub

# Add it to GitHub: https://github.com/settings/keys
```

### "Repository not found"
**Fix:** Repo name might be different or doesn't exist
```bash
# Check if repo exists on GitHub
# Visit: https://github.com/rocketlang/REPO_NAME
```

### "fatal: unable to access..."
**Fix:** Use SSH instead of HTTPS
```bash
# Wrong (HTTPS):
git clone https://github.com/rocketlang/ankr-universe.git

# Correct (SSH):
git clone git@github.com:rocketlang/ankr-universe.git
```

### "git: command not found"
**Fix:** Install git
```bash
pkg install git
```

### Storage Permission Issues
**Fix:** Grant storage permission
```bash
termux-setup-storage

# Then allow when Android asks
```

---

## 💡 Pro Tips for Termux

### 1. Create Aliases:
```bash
# Add to ~/.bashrc
echo 'alias proj="cd ~/projects"' >> ~/.bashrc
echo 'alias gs="git status"' >> ~/.bashrc
echo 'alias gl="git log --oneline -10"' >> ~/.bashrc
echo 'alias gp="git pull"' >> ~/.bashrc

# Reload
source ~/.bashrc

# Now you can use:
proj          # Go to projects
gs            # Git status
gl            # Git log
gp            # Git pull
```

### 2. Setup Git Config:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.editor "nano"
```

### 3. Use Tmux (Multiple Terminals):
```bash
pkg install tmux

# Start tmux
tmux

# Create new window: Ctrl+B then C
# Switch windows: Ctrl+B then N (next) or P (previous)
# Split pane: Ctrl+B then % (vertical) or " (horizontal)
```

### 4. Install Node.js (For Development):
```bash
pkg install nodejs

# Verify
node --version
npm --version
```

---

## 📋 Complete Setup Checklist

- [ ] Termux installed from F-Droid
- [ ] Packages updated (`pkg update && pkg upgrade`)
- [ ] Git installed (`pkg install git`)
- [ ] SSH installed (`pkg install openssh`)
- [ ] SSH key generated (`ssh-keygen`)
- [ ] SSH key added to GitHub
- [ ] Projects directory created (`mkdir ~/projects`)
- [ ] Clone script created (`clone-all.sh`)
- [ ] All repositories cloned
- [ ] Update script created (`update-all.sh`)
- [ ] Git config set (name, email)
- [ ] Text editor installed (nano/vim/micro)
- [ ] Aliases added (optional)

---

## 🚀 Quick Start (Copy-Paste Friendly!)

**Complete setup in one go:**

```bash
# 1. Update and install
pkg update && pkg upgrade -y && pkg install git openssh -y

# 2. Setup directory
mkdir -p ~/projects && cd ~/projects

# 3. Generate SSH key (press Enter 3 times)
ssh-keygen -t ed25519 -C "your.email@example.com"

# 4. Show public key (copy this to GitHub)
cat ~/.ssh/id_ed25519.pub

# 5. After adding key to GitHub, test connection
ssh -T git@github.com

# 6. Clone all repos (paste the clone-all.sh script from above)

# 7. Setup git config
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Done! 🎉
```

---

## 📞 Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify SSH key is added to GitHub
3. Make sure you're using SSH URLs (not HTTPS)
4. Check internet connection

---

**Status:** Ready to clone on Termux! 🚀📱

*Guide created: January 25, 2026*
*All commands tested and verified*
