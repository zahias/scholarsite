# Simple Fix Guide - No SSH Required!

## The Easiest Way (If You Have a Computer with Node.js)

Since you're new to this, here's the **easiest way** that doesn't require SSH:

### Step 1: On Your Computer

1. **Open Terminal/Command Prompt on your computer**
   - **Mac:** Press `Cmd + Space`, type "Terminal", press Enter
   - **Windows:** Press `Win + R`, type "cmd", press Enter
   - **Or:** Use VS Code's built-in terminal

2. **Navigate to your project folder:**
   ```bash
   cd /Users/zahi/Library/CloudStorage/OneDrive-pu.edu.lb/PU-Incubator/GitHub/cursor/scholarsite
   ```
   (Or wherever your project is located)

3. **Rebuild the production files:**
   ```bash
   npm run build
   ```
   (This might take a minute or two)

4. **This creates updated files in the `production/` folder**

### Step 2: Upload to A2 Hosting

**Option A: Using cPanel File Manager (Easiest)**

1. **Log into cPanel** on A2 Hosting
2. **Open File Manager**
3. **Navigate to your app folder** (usually `/home/yourusername/scholarsite`)
4. **Upload the files from the `production/` folder:**
   - Upload `production/index.js` (overwrite the old one)
   - Upload any other files in the `production/` folder

**Option B: Using GitHub (Recommended)**

1. **Commit and push the rebuilt files:**
   ```bash
   git add production/
   git commit -m "Rebuild with email fix"
   git push origin main
   ```

2. **Then on A2, use cPanel Terminal** (see SSH_FOR_BEGINNERS.md for how to open it):
   ```bash
   cd ~/scholarsite-repo
   git pull origin main
   cp -rf production/* ~/scholarsite/
   touch ~/scholarsite/tmp/restart.txt
   ```

### Step 3: Restart Your App

1. **In cPanel, go to "Setup Node.js App"**
2. **Find your application**
3. **Click "Restart App"** or just click "Save" to restart it

### Step 4: Verify Environment Variables

1. **In cPanel, go to "Setup Node.js App"**
2. **Click on your application**
3. **Scroll to "Environment Variables"**
4. **Make sure you have:**
   - `SMTP_PASSWORD` = (your email password)
   - `SMTP_HOST` = `localhost`
   - `SMTP_PORT` = `465`

5. **Click "Save"**

## What If You Don't Have Node.js on Your Computer?

### Option 1: Use A2's Terminal (Simpler than Full SSH)

1. **Log into cPanel**
2. **Search for "Terminal"** in cPanel
3. **Click "Terminal"** - it opens in your browser!
4. **Follow the commands from REBUILD_INSTRUCTIONS.md**

### Option 2: Ask for Help

If this is too complicated, you might want to:
- Ask someone with more experience to help
- Contact A2 Hosting support (they can help with basic setup)
- Use a simpler deployment method

## Quick Checklist

- [ ] Rebuild production files (either locally or on A2)
- [ ] Upload/copy the rebuilt files to A2
- [ ] Set SMTP_PASSWORD environment variable in cPanel
- [ ] Restart the Node.js app in cPanel
- [ ] Test the contact form

## Still Confused?

The key steps are:
1. **Rebuild** - Create new production files with the email code
2. **Upload** - Put those files on your server
3. **Configure** - Set the email password in cPanel
4. **Restart** - Restart your app so it uses the new files

If you get stuck at any step, let me know which step and I can help more specifically!

