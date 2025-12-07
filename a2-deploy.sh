#!/bin/bash

# ScholarSite A2 Hosting Automated Deploy Script
# Place this in ~/scholarsite-repo/ on A2 Hosting
# Run with: ./a2-deploy.sh

set -e

echo "🚀 Deploying ScholarSite to A2 Hosting..."

# Configuration
REPO_DIR=~/scholarsite-repo
DEPLOY_DIR=~/scholarsite

# Step 1: Pull latest from GitHub
echo "📥 Pulling latest changes from GitHub..."
cd $REPO_DIR
git pull origin main

# Step 2: Copy production files to deployment directory
echo "📋 Copying production files..."
cp -r production/* $DEPLOY_DIR/dist/

# Step 3: Restart the application (via cPanel's touch restart)
echo "🔄 Restarting application..."
cd $DEPLOY_DIR
touch tmp/restart.txt 2>/dev/null || mkdir -p tmp && touch tmp/restart.txt

echo ""
echo "✅ Deployment complete!"
echo ""
echo "If the app doesn't restart, manually restart via cPanel Node.js Selector"
