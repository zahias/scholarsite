ScholarSite - A2 Hosting Deployment Guide (UPDATED)
=====================================================

Your A2 Hosting Details:
- Database: bannwebs_scholarsite
- User: bannwebs_admin
- Password: (your password)

===========================================
STEP 1: Create Database Tables
===========================================

Option A: Via phpPgAdmin (Easier)
---------------------------------
1. In cPanel, click "phpPgAdmin"
2. Select your database: bannwebs_scholarsite
3. Click "SQL" in the top menu
4. Copy the ENTIRE contents of "create_tables.sql"
5. Paste into the SQL box and click "Execute"

Option B: Via SSH Terminal
--------------------------
1. SSH into your A2 account
2. Run: psql -U bannwebs_admin -d bannwebs_scholarsite -f create_tables.sql

===========================================
STEP 2: Upload Application Files
===========================================
1. Go to cPanel > File Manager
2. Navigate outside public_html (e.g., /home/bannwebs/)
3. Create folder: scholarsite
4. Upload these files to /home/bannwebs/scholarsite/:
   - dist/ (entire folder)
   - package.json
   - package-lock.json

===========================================
STEP 3: Set Up Node.js App
===========================================
1. cPanel > Software > Setup Node.js App
2. Click CREATE APPLICATION
3. Configure:
   - Node.js Version: 16.20.2 (IMPORTANT - must be v16)
   - Application Mode: Production
   - Application Root: /home/bannwebs/scholarsite
   - Application URL: your domain (e.g., scholarsite.com)
   - Startup File: dist/index.js

4. Click CREATE

===========================================
STEP 4: Add Environment Variables
===========================================
In the Node.js App settings, add these environment variables:

NODE_ENV = production
DATABASE_URL = postgresql://bannwebs_admin:YOUR_PASSWORD@localhost:5432/bannwebs_scholarsite
SESSION_SECRET = ChangeThisToARandomString32CharsOrMore

===========================================
STEP 5: Install Dependencies & Start
===========================================
1. In Node.js Selector, click on your app
2. Click "RUN NPM INSTALL"
3. Wait for completion
4. Click "START APP"

===========================================
STEP 6: Point Domain to App
===========================================
1. cPanel > Domains > Add Domain
2. Add your domain (e.g., scholarsite.com)
3. Point it to the Node.js app's directory

===========================================
STEP 7: First Login
===========================================
Go to: https://yourdomain.com/admin/login

Default Admin Credentials:
- Email: admin@scholarsite.com
- Password: Admin123!

CHANGE THIS PASSWORD IMMEDIATELY!

===========================================
ADDING RESEARCHER SITES
===========================================
1. Login as admin
2. Create a new tenant (customer)
3. Add their domain
4. Create a researcher user for them
5. They can login at: https://theirdomain.com/dashboard/login

===========================================
TROUBLESHOOTING
===========================================
"Unexpected token ?" error:
- Your Node.js version is wrong. Must use Node 16.x, not 18+

App doesn't start:
- Check environment variables are set correctly
- Check Application Logs in cPanel

Database errors:
- Verify DATABASE_URL is correct
- Make sure you ran create_tables.sql successfully

404 errors:
- Ensure Startup File is: dist/index.js
- Check Application Root path is correct
