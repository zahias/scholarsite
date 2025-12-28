#!/bin/bash

# ScholarSite Build Script for GitHub Deployment
# Usage: ./deploy.sh
# 
# This builds the production files into the production/ folder.
# Then commit and push to GitHub, and run deploy.sh on A2.

set -e

echo "🚀 Building ScholarSite for production (light mode)..."

# Run a single-threaded build so it succeeds in constrained environments
npm run build:light

# Step 3: Prepare production folder
echo "📋 Preparing production folder..."
rm -rf production/*
mkdir -p production
cp -r dist/public production/
cp dist/index.js production/
if [ -f dist/a2-starter.cjs ]; then
  cp dist/a2-starter.cjs production/
elif [ -f a2-starter.cjs ]; then
  cp a2-starter.cjs production/
fi
cp package.json package-lock.json production/

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  1. Commit and push to GitHub (use Git pane)"
echo "  2. On A2, run: ./deploy.sh"
