# Contact Form Troubleshooting Guide

## Quick Diagnosis

### Check 1: Is the production build updated?
SSH into A2 and check if the production code has email functionality:
```bash
cd ~/scholarsite
grep -i "nodemailer\|sendMail\|transporter" index.js
```

**If nothing is found:** The production build is outdated. You need to rebuild (see REBUILD_INSTRUCTIONS.md)

**If found:** The code is there, check environment variables and SMTP settings.

### Check 2: Are environment variables set?
In cPanel Node.js Selector, verify these are set:
- `SMTP_PASSWORD` ✅
- `SMTP_HOST` (optional, defaults to localhost)
- `SMTP_PORT` (optional, defaults to 465)
- `SMTP_USER` (optional, defaults to info@scholar.name)

### Check 3: Check application logs
```bash
cd ~/scholarsite
tail -f logs/*.log
# OR check email_debug.log if it exists
cat email_debug.log
```

### Check 4: Test SMTP connection manually
SSH into A2 and test:
```bash
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'info@scholar.name',
    pass: process.env.SMTP_PASSWORD
  }
});
transporter.verify().then(() => console.log('✅ SMTP OK')).catch(e => console.error('❌ SMTP Error:', e.message));
"
```

## Common Issues

### Issue 1: "Email service not configured"
**Solution:** Add `SMTP_PASSWORD` environment variable in cPanel Node.js Selector

### Issue 2: "Email authentication failed"
**Solution:** 
- Verify the password for info@scholar.name is correct
- Make sure the email account exists in cPanel
- Try using the full email address as SMTP_USER

### Issue 3: "Cannot connect to email server"
**Solution:**
- Try `SMTP_HOST=localhost`
- If that doesn't work, try `SMTP_HOST=mail.scholar.name`
- Check if port 465 is blocked, try port 587 with `SMTP_PORT=587`

### Issue 4: Production code doesn't have email functionality
**Solution:** Rebuild the production files (see REBUILD_INSTRUCTIONS.md)

## Quick Fix Steps

1. **Rebuild production files on A2:**
   ```bash
   cd ~/scholarsite-repo
   git pull origin main
   npm run build
   cp -rf production/* ~/scholarsite/
   touch ~/scholarsite/tmp/restart.txt
   ```

2. **Verify environment variables are set in cPanel**

3. **Test the contact form**

4. **Check logs for errors:**
   ```bash
   cd ~/scholarsite
   tail -50 email_debug.log
   ```

