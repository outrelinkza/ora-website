# GitHub-Vercel Connection Setup Guide

## Current Configuration
- **Repository**: `outrelinkza/ora-website`
- **Vercel Project**: `ora-website`
- **Vercel Org**: `outrelinkxx`

## Step-by-Step Fix

### Step 1: Check Vercel GitHub App Installation

1. Go to: **https://github.com/settings/installations**
2. Look for **"Vercel"** in the list of installed apps
3. Click **"Configure"** next to Vercel

### Step 2: Verify Repository Access

In the Vercel app configuration page:

1. Scroll to **"Repository access"** section
2. Check if it says:
   - ✅ **"All repositories"** (recommended), OR
   - ✅ **"Only select repositories"** with `outrelinkza/ora-website` listed

3. If `ora-website` is NOT listed:
   - Click **"Select repositories"**
   - Search for and select `outrelinkza/ora-website`
   - Click **"Save"**

### Step 3: Link Repository in Vercel Dashboard

1. Go to: **https://vercel.com/outrelinkxx/ora-website/settings/git**
2. If you see "No Git Repository Connected":
   - Click **"Connect Git Repository"**
   - Select **GitHub**
   - Find and select `outrelinkza/ora-website`
   - Click **"Connect"**

3. If it's already connected, you should see:
   - Repository: `outrelinkza/ora-website`
   - Production Branch: `main` or `master`

### Step 4: Verify Webhook (Optional but Recommended)

1. Go to: **https://github.com/outrelinkza/ora-website/settings/hooks**
2. Look for a webhook with:
   - **Payload URL**: `https://api.vercel.com/v1/integrations/deploy/...`
   - **Status**: Active (green checkmark)

3. If webhook is missing:
   - Vercel should create it automatically when you connect the repo
   - If not, the connection in Step 3 should fix it

### Step 5: Test Automatic Deployment

1. Make a small change to any file (e.g., add a comment)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Check Vercel dashboard: **https://vercel.com/outrelinkxx/ora-website**
4. You should see a new deployment triggered automatically

## Troubleshooting

### If "Connect Git Repository" button doesn't work:
- Make sure you're logged into the correct Vercel account
- Check that the Vercel GitHub App has access to the repository (Step 1-2)

### If deployments still don't trigger automatically:
- Check that you're pushing to the correct branch (usually `main` or `master`)
- Verify the branch in Vercel project settings matches your default branch
- Try disconnecting and reconnecting the repository

### If you get permission errors:
- Ensure you have admin access to the GitHub repository
- Check that your Vercel account has the right permissions in the team/org

## Quick Links

- **Vercel Project Settings**: https://vercel.com/outrelinkxx/ora-website/settings
- **Git Settings**: https://vercel.com/outrelinkxx/ora-website/settings/git
- **GitHub App Settings**: https://github.com/settings/installations
- **Repository Webhooks**: https://github.com/outrelinkza/ora-website/settings/hooks

