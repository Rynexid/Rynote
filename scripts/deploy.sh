#!/bin/bash
# ============================================
# Rynote One-Click Deploy
# Run from LAPTOP: bash deploy.sh
# ============================================
set -e

VPS_IP="94.237.77.52"
VPS_USER="root"
BOT_DIR="/home/riu/Projects/Discords/Rynote"

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     Rynote One-Click Deploy           ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""
echo "  VPS: $VPS_USER@$VPS_IP"
echo ""

# ─── Step 1: Setup VPS ───
echo "[1/4] Setting up VPS..."
ssh $VPS_USER@$VPS_IP "bash -s" << 'SETUP'
apt-get update -qq && apt-get upgrade -y -qq
curl -fsSL https://deb.nodesource.com/setup_24.x | bash - 2>/dev/null
apt-get install -y -qq nodejs openjdk-21-jre-headless 2>/dev/null

mkdir -p /opt/lavalink /opt/rynote/logs

# Lavalink
if [ ! -f /opt/lavalink/Lavalink.jar ]; then
  curl -L -o /opt/lavalink/Lavalink.jar "https://github.com/lavalink-devs/Lavalink/releases/download/v4.0.8/Lavalink.jar" -s
fi

cat > /opt/lavalink/application.yml << 'LAVA'
server:
  port: 2333
  address: 0.0.0.0
lavalink:
  server:
    password: youshallnotpass
    sources:
      youtube: false
      soundcloud: true
      http: true
  plugins:
    youtube:
      sourceRedirect: true
LAVA

cat > /etc/systemd/system/lavalink.service << 'SVC'
[Unit]
Description=Lavalink
After=network.target
[Service]
ExecStart=/usr/bin/java -jar Lavalink.jar
WorkingDirectory=/opt/lavalink
Restart=always
Environment=JAVA_OPTS="-Xms256m -Xmx384m"
[Install]
WantedBy=multi-user.target
SVC

systemctl daemon-reload && systemctl enable lavalink && systemctl restart lavalink

# Firewall
ufw allow 22/tcp -qq 2>/dev/null
ufw allow 2333/tcp -qq 2>/dev/null
ufw allow 8080/tcp -qq 2>/dev/null
ufw --force enable -qq 2>/dev/null

echo "VPS_SETUP_DONE"
SETUP

echo "  VPS setup complete!"

# ─── Step 2: Upload files ───
echo "[2/4] Uploading bot files..."
cd "$BOT_DIR"

# Upload dist folder
scp -q -r dist/ $VPS_USER@$VPS_IP:/opt/rynote/

# Upload config files
scp -q -r languages/ app.yml emoji.json package.json package-lock.json ecosystem.config.cjs $VPS_USER@$VPS_IP:/opt/rynote/

echo "  Files uploaded!"

# ─── Step 3: Install & Start ───
echo "[3/4] Installing dependencies & starting bot..."
ssh $VPS_USER@$VPS_IP "bash -s" << 'START'
cd /opt/rynote
npm install --production -qq 2>/dev/null

# Create systemd service for rynote
cat > /etc/systemd/system/rynote.service << 'SVC'
[Unit]
Description=Rynote Discord Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/rynote
ExecStart=/usr/bin/node --no-deprecation ./dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SVC

systemctl daemon-reload
systemctl enable rynote
systemctl restart rynote
echo "BOT_STARTED"
START

echo "  Bot started!"

# ─── Step 4: Verify ───
echo "[4/4] Verifying..."
ssh $VPS_USER@$VPS_IP "bash -s" << 'VERIFY'
systemctl status rynote --no-pager
echo "---"
journalctl -u rynote -n 20 --no-pager
VERIFY

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     Deploy Complete!                  ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""
echo "  Bot is running 24/7 on $VPS_IP"
echo ""
echo "  Useful commands:"
echo "    ssh $VPS_USER@$VPS_IP"
echo "    systemctl status rynote"
echo "    journalctl -u rynote -f"
echo "    systemctl restart rynote"
echo "    systemctl stop rynote"
echo ""
