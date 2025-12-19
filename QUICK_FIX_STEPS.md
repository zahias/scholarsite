# Quick Fix Steps - Run These Commands on A2

## Step-by-Step Commands

Copy and paste these commands **one at a time** in your A2 Terminal:

### Step 1: Go to your repository folder
```bash
cd ~/scholarsite-repo
```

### Step 2: Make sure you have the latest code
```bash
git pull origin main
```

### Step 3: Install dependencies (if needed)
```bash
npm install
```
*(This might take a few minutes - wait for it to finish)*

### Step 4: Build the production files
```bash
./deploy.sh
```
*(This will take 1-2 minutes - wait for "✅ Build complete!" message)*

**OR if deploy.sh doesn't work, try:**
```bash
npm run build
```
*(Then manually copy files - see Step 5b below)*

### Step 5: Copy the rebuilt files to your app

**Option A: If deploy.sh worked (recommended)**
```bash
cp -rf production/* ~/scholarsite/
```

**Option B: If you used npm run build instead**
```bash
mkdir -p ~/scholarsite
cp -rf dist/public ~/scholarsite/public
cp dist/index.js ~/scholarsite/index.js
cp package.json package-lock.json ~/scholarsite/
```

### Step 6: Restart your app
```bash
touch ~/scholarsite/tmp/restart.txt
```

### Step 7: Verify the fix worked
Check that the new index.js has email code:
```bash
grep -i "nodemailer\|sendMail" ~/scholarsite/index.js | head -5
```

If you see output, the email code is there! ✅

## Troubleshooting

### If "npm install" fails:
- Make sure you're in the right directory: `pwd` should show `scholarsite-repo`
- Try: `npm install --legacy-peer-deps`

### If "npm run build" is aborted:
- Check if you have enough disk space: `df -h`
- Try building just the backend: `npx esbuild server/index-production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js`

### If deploy.sh doesn't exist:
- Use the manual build steps (Step 5b above)

## What Each Command Does

- `cd ~/scholarsite-repo` - Go to your code folder
- `git pull` - Get latest code from GitHub
- `npm install` - Install required packages
- `./deploy.sh` - Build everything for production
- `cp -rf production/* ~/scholarsite/` - Copy new files to your app
- `touch tmp/restart.txt` - Tell the server to restart

