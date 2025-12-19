# Rebuild Production Files - Contact Form Fix

## Problem
The production build (`production/index.js`) is outdated and doesn't include the email functionality. You need to rebuild the production files.

## Solution: Rebuild on A2 Hosting

### Option 1: Rebuild on A2 Hosting via SSH (Recommended)

1. **SSH into your A2 hosting account**

2. **Navigate to your repository directory:**
   ```bash
   cd ~/scholarsite-repo
   # OR wherever you cloned the GitHub repo
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

4. **Rebuild production files:**
   ```bash
   # Make sure you're in the repo directory
   npm run build
   # OR run the deploy script
   ./deploy.sh
   ```

5. **Copy rebuilt files to deployment directory:**
   ```bash
   cp -rf production/* ~/scholarsite/
   ```

6. **Restart the application:**
   ```bash
   cd ~/scholarsite
   touch tmp/restart.txt
   ```

### Option 2: Rebuild Locally and Upload

1. **On your local machine, run:**
   ```bash
   ./deploy.sh
   ```

2. **This creates updated files in the `production/` folder**

3. **Commit and push the rebuilt files:**
   ```bash
   git add production/
   git commit -m "Rebuild production with email functionality"
   git push origin main
   ```

4. **On A2, pull and deploy:**
   ```bash
   cd ~/scholarsite-repo
   git pull origin main
   cp -rf production/* ~/scholarsite/
   touch ~/scholarsite/tmp/restart.txt
   ```

## Verify the Fix

After rebuilding, check that the production/index.js file includes:
- `nodemailer`
- `transporter`
- `sendMail`
- SMTP configuration

You can search for these terms in the file to verify.

## Important: Environment Variables

Make sure these are set in A2 Hosting cPanel Node.js Selector:
- `SMTP_PASSWORD` = password for info@scholar.name
- `SMTP_HOST` = localhost (or your mail server)
- `SMTP_PORT` = 465
- `SMTP_USER` = info@scholar.name

