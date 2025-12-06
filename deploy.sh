#!/bin/bash

# ScholarSite A2 Hosting Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting ScholarSite deployment to A2 Hosting..."

# Step 1: Build frontend
echo "📦 Building frontend..."
npx vite build

# Step 2: Build backend for production
echo "📦 Building backend..."
npx esbuild server/index-production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js

# Step 3: Copy necessary files to dist
echo "📋 Preparing deployment files..."
cp package.json dist/
cp package-lock.json dist/

# Ensure a2-starter.cjs exists in dist
if [ ! -f "dist/a2-starter.cjs" ]; then
  cat > dist/a2-starter.cjs << 'EOF'
// CommonJS wrapper for Passenger compatibility
// Passenger requires a .cjs file that loads the ESM module

async function start() {
  try {
    await import('./index.js');
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();
EOF
fi

# Step 4: Stage and commit dist folder
echo "📝 Committing build to git..."
git add -f dist/
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" --allow-empty

# Step 5: Push to A2
echo "🚀 Pushing to A2 Hosting..."
git push a2 HEAD:main --force

echo "✅ Deployment complete!"
echo "   Your site should be live at https://scholar.name"
