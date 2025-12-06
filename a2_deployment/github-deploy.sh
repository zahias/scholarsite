#!/bin/bash

# GitHub Deploy Script for A2 Hosting
# Run this on A2 via SSH or cron to pull latest changes from GitHub
#
# Usage: ./deploy.sh
# 
# Setup:
# 1. Clone your GitHub repo to /home/bannwebs/scholarsite-repo
# 2. Put this script in /home/bannwebs/deploy.sh
# 3. chmod +x deploy.sh
# 4. Run manually or add to cron

REPO_DIR="/home/bannwebs/scholarsite-repo"
DEPLOY_DIR="/home/bannwebs/scholarsite"

echo "🚀 Starting deployment from GitHub..."

# Pull latest changes
cd $REPO_DIR
echo "📥 Pulling latest changes..."
git fetch origin
git reset --hard origin/main

# Copy production folder to deploy directory
echo "📋 Deploying files..."
mkdir -p $DEPLOY_DIR
cp -rf $REPO_DIR/production/* $DEPLOY_DIR/

# Install dependencies
echo "📥 Installing dependencies..."
cd $DEPLOY_DIR
npm install --production --legacy-peer-deps 2>&1

# Restart application
echo "🔄 Restarting application..."
mkdir -p $DEPLOY_DIR/tmp
touch $DEPLOY_DIR/tmp/restart.txt

echo "✅ Deployment complete!"
echo "   Site: https://scholar.name"
