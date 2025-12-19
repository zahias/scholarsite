#!/bin/bash

# ScholarSite A2 Hosting Automated Deploy Script (Node 18, low-resource)
# Place this in ~/scholarsite-repo/ on A2 Hosting and execute it there.

set -euo pipefail

NODE_ENV_NAME=${NODE_ENV_NAME:-scholarsite}
NODE_ENV_VERSION=${NODE_ENV_VERSION:-18}
NODE_ENV_PATH=${NODE_ENV_PATH:-/home/bannwebs/nodevenv/$NODE_ENV_NAME/$NODE_ENV_VERSION/bin/activate}
REPO_DIR=${REPO_DIR:-~/scholarsite-repo}
DEPLOY_DIR=${DEPLOY_DIR:-~/scholarsite}

echo "🚀 Deploying ScholarSite to A2 Hosting (Node $NODE_ENV_VERSION)..."

if [ -f "$NODE_ENV_PATH" ]; then
  echo "🔧 Activating Node environment at $NODE_ENV_PATH"
  # shellcheck source=/dev/null
  source "$NODE_ENV_PATH"
else
  echo "⚠️ Node environment not found at $NODE_ENV_PATH. Please adjust NODE_ENV_PATH."
fi

echo "📥 Pulling latest changes from GitHub..."
cd "$REPO_DIR"
git pull origin main

echo "📦 Installing production dependencies (limited concurrency)..."
export npm_config_child_concurrency=1
export npm_config_jobs=1
npm install --omit=dev --omit=optional --ignore-scripts

echo "🛠️ Building production bundle..."
npm run build:light

echo "📁 Preparing production assets..."
rm -rf production/*
mkdir -p production
cp -r dist/public production/
cp dist/index.js production/
cp dist/a2-starter.cjs production/
cp package.json package-lock.json production/

echo "📋 Copying production build to $DEPLOY_DIR/dist/..."
mkdir -p "$DEPLOY_DIR/dist"
cp -r production/* "$DEPLOY_DIR/dist/"

echo "📦 Installing runtime dependencies in $DEPLOY_DIR..."
cd "$DEPLOY_DIR"
npm install --omit=dev --omit=optional --ignore-scripts

echo "🔄 Touching tmp/restart.txt to restart Passenger..."
touch tmp/restart.txt 2>/dev/null || (mkdir -p tmp && touch tmp/restart.txt)

echo ""
echo "✅ Deployment complete!"
echo "→ Run 'tail -n 20 email_debug.log' and review the logs in ~/scholarsite (if needed)."
