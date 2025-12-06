#!/bin/bash

# ScholarSite Build Script for GitHub Deployment
# Usage: ./deploy.sh
# 
# This builds the production files into the production/ folder.
# Then commit and push to GitHub, and run deploy.sh on A2.

set -e

echo "🚀 Building ScholarSite for production..."

# Step 1: Build frontend
echo "📦 Building frontend..."
npx vite build

# Step 2: Build backend for production
echo "📦 Building backend..."
npx esbuild server/index-production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js

# Step 3: Prepare production folder
echo "📋 Preparing production folder..."
rm -rf production/*
mkdir -p production
cp -r dist/public production/
cp dist/index.js production/
cp dist/a2-starter.cjs production/
cp package.json package-lock.json production/

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  1. Commit and push to GitHub (use Git pane)"
echo "  2. On A2, run: ./deploy.sh"
