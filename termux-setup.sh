#!/data/data/com.termux/files/usr/bin/bash

# ANKR Termux Setup Script
echo "🚀 ANKR Termux Setup"
echo "==================="
echo ""

# Update and install packages
echo "📦 Installing packages..."
pkg update -y && pkg upgrade -y
pkg install git openssh nano -y

# Setup directory
echo "📁 Creating projects directory..."
mkdir -p ~/projects
cd ~/projects

# Check for SSH key
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "🔑 Generating SSH key..."
    echo "Press Enter 3 times when prompted"
    ssh-keygen -t ed25519 -C "termux@android"
    
    echo ""
    echo "✅ SSH Key Generated!"
    echo "📋 Copy this to GitHub:"
    echo "-------------------------------------------"
    cat ~/.ssh/id_ed25519.pub
    echo "-------------------------------------------"
    echo ""
    echo "Add to: https://github.com/settings/keys"
    echo "Press Enter when done..."
    read
else
    echo "✅ SSH key already exists"
fi

# Test GitHub
echo "🔗 Testing GitHub connection..."
ssh -T git@github.com

# Git config
echo "⚙️  Configuring git..."
git config --global user.name "ANKR Dev"
git config --global user.email "dev@ankr.digital"

# Create clone script
cat > ~/projects/clone-all.sh << 'INNEREOF'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/projects
repos="ankr-universe ankr-labs-nx ankr-ai-gateway ankr-sandbox ankr-skill-loader ankrcode bani swayam power-erp everpure-whatsapp-bot"
for repo in $repos; do
  if [ -d "$repo" ]; then
    echo "⏭️  $repo exists"
  else
    echo "📥 Cloning $repo..."
    git clone git@github.com:rocketlang/${repo}.git
  fi
done
echo "✅ Done!"
INNEREOF

chmod +x ~/projects/clone-all.sh

# Create update script
cat > ~/projects/update-all.sh << 'INNEREOF2'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/projects
for dir in */; do
  if [ -d "$dir/.git" ]; then
    echo "📦 Updating $dir"
    cd "$dir"
    git pull
    cd ..
  fi
done
INNEREOF2

chmod +x ~/projects/update-all.sh

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Add SSH key to GitHub"
echo "2. Run: ~/projects/clone-all.sh"
echo "3. Run: ~/projects/update-all.sh"
echo ""
