# SSH for Beginners - A2 Hosting Guide

## What is SSH?

SSH (Secure Shell) is a way to connect to your server and run commands directly, like using a command line on your computer but connected to your web server.

Think of it like this:
- **cPanel** = A visual dashboard (like a remote control)
- **SSH** = Direct access to the server (like sitting at the computer)

## How to Access SSH on A2 Hosting

### Method 1: Using cPanel Terminal (Easiest - No Software Needed!)

1. **Log into cPanel**
   - Go to your A2 Hosting account
   - Log into cPanel (usually at `yourdomain.com/cpanel`)

2. **Open Terminal**
   - In cPanel, search for "Terminal" in the search box
   - Click on "Terminal" or "SSH Access"
   - A terminal window will open in your browser

3. **You're in!** 
   - You'll see a command prompt like: `[username@server ~]$`
   - You can now type commands

### Method 2: Using SSH Software (For Advanced Users)

If you want to use software on your computer:

**On Mac/Linux:**
- Open "Terminal" app (built-in)
- Type: `ssh username@your-server-ip`
- Enter your password when prompted

**On Windows:**
- Download "PuTTY" (free SSH software)
- Enter your server IP and username
- Connect

## Finding Your SSH Details in A2 Hosting

1. **Log into cPanel**
2. **Look for "SSH Access"** in the Security section
3. **Your details will show:**
   - Username: Usually your cPanel username
   - Server: Your server hostname or IP
   - Port: Usually 7822 (A2 uses a custom port)

## Basic Commands You'll Need

Once you're in the terminal, here are the commands:

```bash
# See where you are
pwd

# List files in current folder
ls

# Change directory (go to a folder)
cd ~/scholarsite

# Go to your home directory
cd ~

# See what's in a file
cat filename.txt

# Edit a file (opens text editor)
nano filename.txt
# (Press Ctrl+X to exit, Y to save)

# Run a command as administrator (if needed)
sudo command
```

## Step-by-Step: Rebuilding Your Contact Form

1. **Open Terminal in cPanel** (Method 1 above)

2. **Navigate to your repository:**
   ```bash
   cd ~/scholarsite-repo
   ```
   (If you don't have a repo folder, you might need to clone it first - see below)

3. **Pull latest code from GitHub:**
   ```bash
   git pull origin main
   ```

4. **Rebuild the production files:**
   ```bash
   npm run build
   ```

5. **Copy files to your app directory:**
   ```bash
   cp -rf production/* ~/scholarsite/
   ```

6. **Restart your app:**
   ```bash
   cd ~/scholarsite
   touch tmp/restart.txt
   ```

## If You Don't Have a Repository Folder Yet

If you haven't set up the repository on A2 yet:

1. **In Terminal, go to your home directory:**
   ```bash
   cd ~
   ```

2. **Clone your GitHub repository:**
   ```bash
   git clone https://github.com/zahias/scholarsite.git scholarsite-repo
   ```
   (Replace `zahias/scholarsite` with your actual GitHub username/repo)

3. **Then follow the rebuild steps above**

## Alternative: Use cPanel File Manager Instead

If SSH seems too complicated, you can also:

1. **Use cPanel File Manager** to upload files
2. **Use cPanel Node.js Selector** to restart the app
3. **But you'll still need to rebuild the files** - this requires running `npm run build`, which typically needs SSH/Terminal

## Getting Help

If you get stuck:
- Check the error message - it usually tells you what's wrong
- Make sure you're in the right directory (use `pwd` to check)
- Make sure Node.js is installed (A2 should have it in Node.js Selector)

## Quick Reference

| What You Want | Command |
|--------------|---------|
| See current folder | `pwd` |
| List files | `ls` |
| Go to home | `cd ~` |
| Go to app folder | `cd ~/scholarsite` |
| See file contents | `cat filename` |
| Copy files | `cp source destination` |
| Move files | `mv source destination` |
| Create folder | `mkdir foldername` |
| Delete file | `rm filename` |
| Exit terminal | `exit` or close window |

