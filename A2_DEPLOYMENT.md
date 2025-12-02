# ScholarSite A2 Hosting Deployment Guide

## Prerequisites
- A2 Hosting Shared Turbo plan with Node.js support
- PostgreSQL database created in cPanel
- Shell (SSH) access enabled

## Step 1: Create PostgreSQL Database

1. Log into A2 cPanel
2. Go to **PostgreSQL Databases**
3. Create a database (e.g., `admin_scholarsite`)
4. Create a user and set a strong password
5. Add user to the database with all privileges

Your connection string will be:
```
postgresql://admin_username:password@localhost:5432/admin_scholarsite
```

## Step 2: Prepare Files for Upload

On your local machine or Replit, run:
```bash
npm run build
```

This creates:
- `dist/` folder with compiled server code (includes index.js entry point)
- `dist/public/` folder with frontend files

## Step 3: Upload Files

Upload these to your A2 hosting via FTP or cPanel File Manager:
- `dist/` folder (entire folder with all compiled JS files)
- `node_modules/` folder (or run npm install on A2)
- `package.json`
- `package-lock.json`
- `server.js` (entry point that loads dist/index.js)
- `.env` file (create this with your settings)
- `drizzle.config.ts` (for database migrations)

## Step 4: Create .env File

Create `.env` in your A2 app directory:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://admin_username:password@localhost:5432/admin_scholarsite
SESSION_SECRET=your-long-random-secret-key-here
```

## Step 5: Set Up Node.js App in cPanel

1. Go to **Setup Node.js App** in cPanel
2. Click **Create Application**
3. Settings:
   - Node.js version: 16.20.2 (latest available)
   - Application mode: Production
   - Application root: your app folder
   - Application URL: your domain
   - Application startup file: `server.js`
4. Click **Create**
5. Click **Run NPM Install** to install dependencies

## Step 6: Initialize Database

SSH into your A2 server and run:
```bash
cd ~/your-app-folder
source ~/nodevenv/your-app-folder/16/bin/activate
npm run db:push
```

## Step 7: Create Admin User

Use the API or database to create your first admin user:
```bash
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"YourSecurePassword123","firstName":"Admin","lastName":"User"}'
```

Then update the user role to admin via database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

## Step 8: Verify Deployment

Visit your domain and test:
- Landing page loads
- Researcher search works
- Login/registration works
- Admin features work (after creating admin user)

## Troubleshooting

### App won't start
- Check Node.js version (must be 16.x)
- Check error logs in cPanel
- Verify DATABASE_URL is correct

### Database connection fails
- Test PostgreSQL connection in cPanel
- Verify username/password
- Check if database exists

### Static files not loading
- Verify `dist/public/` folder exists
- Check file permissions (755 for folders, 644 for files)

## Updating the App

1. Build new version locally
2. Upload updated files via FTP
3. In cPanel Node.js App, click **Restart**

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| NODE_ENV | Set to "production" |
| PORT | Server port (default 3000) |
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | Secret for session encryption |
