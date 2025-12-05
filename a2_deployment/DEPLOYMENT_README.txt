ScholarSite - A2 Hosting Deployment Guide
==========================================

STEP 1: Upload Files
--------------------
1. Log into cPanel
2. Go to File Manager
3. Create folder: /home/YOUR_USERNAME/scholarsite (outside public_html)
4. Upload ALL contents of this folder to that directory

STEP 2: Set Up Node.js App
--------------------------
1. cPanel > Software > Setup Node.js App
2. Click CREATE APPLICATION
3. Configure:
   - Node.js Version: 16.20.2
   - Application Mode: Production
   - Application Root: /home/YOUR_USERNAME/scholarsite
   - Application URL: your domain
   - Startup File: dist/index.js
4. Click CREATE

STEP 3: Add Environment Variables
---------------------------------
In the Node.js Selector, add these variables:

NODE_ENV = production
DATABASE_URL = postgresql://admin:YOUR_PASSWORD@localhost:5432/scholarsite
SESSION_SECRET = (generate a random 32+ character string)

STEP 4: Install Dependencies
----------------------------
1. In Node.js Selector, click on your app
2. Click RUN NPM INSTALL
3. Wait for completion

STEP 5: Initialize Database
---------------------------
Via SSH or cPanel Terminal:
cd ~/scholarsite
npx drizzle-kit push

STEP 6: Start App
-----------------
Click START APP in Node.js Selector

STEP 7: Create Admin Account
----------------------------
Once running, the first login at /admin/login will use:
Email: admin@scholarsite.com
Password: Admin123!

(Change this password immediately after first login!)

TROUBLESHOOTING
---------------
- If app doesn't start: Check environment variables are set correctly
- If database errors: Verify DATABASE_URL and run migrations again
- If 404 errors: Ensure Startup File is set to dist/index.js
