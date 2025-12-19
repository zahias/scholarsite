# Fix npm install Aborted on A2 Hosting

## Problem
`npm install` keeps getting aborted, usually due to:
- Memory limits on shared hosting
- Timeout issues
- Too many dependencies

## Solutions (Try in Order)

### Solution 1: Install with Legacy Peer Deps (Easiest)
```bash
npm install --legacy-peer-deps
```
This skips some dependency checks and uses less memory.

### Solution 2: Install Production Dependencies Only
```bash
npm install --production --legacy-peer-deps
```
This installs only what's needed to run (not dev tools), using less memory.

### Solution 3: Increase Memory Limit (If Possible)
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm install --legacy-peer-deps
```

### Solution 4: Install in Smaller Batches
If the above don't work, you might need to build locally and upload.

## Alternative: Build Locally and Upload

Since A2 might have memory limits, the easiest solution is to build on your computer:

### On Your Computer:

1. **Open Terminal/Command Prompt**

2. **Go to your project:**
   ```bash
   cd /Users/zahi/Library/CloudStorage/OneDrive-pu.edu.lb/PU-Incubator/GitHub/cursor/scholarsite
   ```

3. **Build the production files:**
   ```bash
   npm run build
   ```
   (Or `./deploy.sh` if you have the script)

4. **This creates files in the `production/` folder**

5. **Upload to GitHub:**
   ```bash
   git add production/
   git commit -m "Rebuild production files"
   git push origin main
   ```

### Then on A2:

1. **Pull the built files:**
   ```bash
   cd ~/scholarsite-repo
   git pull origin main
   ```

2. **Copy to your app (no build needed!):**
   ```bash
   cp -rf production/* ~/scholarsite/
   touch ~/scholarsite/tmp/restart.txt
   ```

3. **Install only runtime dependencies:**
   ```bash
   cd ~/scholarsite
   npm install --production --legacy-peer-deps
   ```

## Why This Works

- Building locally uses your computer's resources (no limits)
- You only upload the final built files
- On A2, you only install what's needed to run (not build tools)
- Much faster and more reliable

## Quick Commands Summary

**On Your Computer:**
```bash
cd /path/to/scholarsite
npm run build
git add production/
git commit -m "Rebuild"
git push
```

**On A2:**
```bash
cd ~/scholarsite-repo
git pull
cp -rf production/* ~/scholarsite/
cd ~/scholarsite
npm install --production --legacy-peer-deps
touch tmp/restart.txt
```

