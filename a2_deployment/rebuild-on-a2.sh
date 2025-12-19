#!/bin/bash

# Rebuild Script for A2 Hosting
# Run this on A2 via SSH after pulling latest code
# Usage: ./rebuild-on-a2.sh

set -e

REPO_DIR="${1:-~/scholarsite-repo}"
DEPLOY_DIR="${2:-~/scholarsite}"

echo "🔨 Rebuilding ScholarSite on A2 Hosting..."

# Step 1: Navigate to repo and pull latest
echo "📥 Pulling latest code..."
cd $REPO_DIR
git pull origin main

# Step 2: Rebuild production files
echo "🔨 Building production files..."
# Activate Node.js environment if needed
if [ -f ~/nodevenv/scholarsite-repo/16/bin/activate ]; then
    source ~/nodevenv/scholarsite-repo/16/bin/activate
fi

npm run build

# Step 3: Copy rebuilt files to deployment directory
echo "📋 Copying rebuilt files..."
mkdir -p $DEPLOY_DIR
cp -rf production/* $DEPLOY_DIR/

# Step 4: Install dependencies (if needed)
echo "📦 Installing dependencies..."
cd $DEPLOY_DIR
npm install --production --legacy-peer-deps 2>&1 || echo "npm install completed with warnings"

# Step 5: Restart application
echo "🔄 Restarting application..."
mkdir -p $DEPLOY_DIR/tmp
touch $DEPLOY_DIR/tmp/restart.txt

echo ""
echo "✅ Rebuild complete!"
echo "   Check the application logs to verify it's running"
echo "   Test the contact form to ensure emails are working"

