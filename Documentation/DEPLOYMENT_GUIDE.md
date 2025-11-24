# Deployment Guide - Exam Prepper

This guide walks you through deploying the Exam Prepper application to production.

## Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- Supabase account (free tier is sufficient)
- Anthropic API key

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project name (e.g., "exam-prepper")
5. Create a strong database password
6. Select a region close to your users
7. Click "Create new project"

### 1.2 Run Database Migrations

1. In your Supabase project dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy the contents of `supabase/migrations/20250103_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the migration
6. Verify tables were created in the "Table Editor" section

### 1.3 Get Supabase Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhb...`)

## Step 2: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to API Keys section
4. Click "Create Key"
5. Name it "exam-prepper-production"
6. Copy the key (starts with `sk-ant-...`)
7. **Save it securely** - you won't be able to see it again

## Step 3: Push Code to GitHub

### 3.1 Initialize Git Repository

```bash
cd exam-prepper
git init
git add .
git commit -m "Initial commit: Exam Prepper MVP"
```

### 3.2 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "+" → "New repository"
3. Name: `exam-prepper`
4. Description: "AI-powered exam preparation tool for Finnish students"
5. Keep it Public or Private (your choice)
6. **Do NOT** initialize with README (we already have one)
7. Click "Create repository"

### 3.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR-USERNAME/exam-prepper.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel

### 4.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Find your `exam-prepper` repository
5. Click "Import"

### 4.2 Configure Project

**Framework Preset**: Next.js (auto-detected)
**Root Directory**: `./`
**Build Command**: `npm run build` (default)
**Output Directory**: `.next` (default)

### 4.3 Add Environment Variables

Click "Environment Variables" and add the following:

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | From Step 1.3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key | From Step 1.3 |
| `ANTHROPIC_API_KEY` | Your Anthropic API Key | From Step 2 |

**Important**: Make sure to add these to all environments (Production, Preview, Development)

### 4.4 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for the build to complete
3. You'll get a live URL like: `https://exam-prepper.vercel.app`

## Step 5: Verify Deployment

### 5.1 Test the Application

1. Visit your Vercel URL
2. Click "Luo uusi kysymyssarja"
3. Fill in the form with test data:
   - Name: "Test Set"
   - Subject: English
   - Grade: 4
   - Difficulty: Normaali
   - Question Count: 20
   - Material: Paste some English vocabulary or sentences
4. Click "Luo 20 kysymystä"
5. Wait for generation (30-60 seconds)
6. Verify you get a shareable code
7. Click "Pelaa nyt!"
8. Answer a few questions
9. Check the results screen

### 5.2 Test Code Sharing

1. Copy the generated code
2. Open a new incognito/private browser window
3. Go to your Vercel URL
4. Enter the code
5. Verify it loads the question set
6. Play the quiz

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain in Vercel

1. In your Vercel project, go to Settings → Domains
2. Enter your domain (e.g., `examprepper.fi`)
3. Follow the DNS configuration instructions

### 6.2 Update Environment Variables

If using a custom domain, update:
```
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

## Troubleshooting

### Build Fails

**Issue**: TypeScript errors during build

**Solution**:
```bash
# Run locally first
npm run typecheck
npm run build
```

Fix any errors before pushing to GitHub.

### Questions Don't Generate

**Issue**: API returns 500 error

**Possible Causes**:
1. Invalid `ANTHROPIC_API_KEY`
2. API key has no credits
3. File upload too large (>10MB)

**Solution**:
- Check Vercel logs: Project → Deployments → [Latest] → Runtime Logs
- Verify environment variables are set correctly
- Check Anthropic console for API usage/errors

### Database Connection Fails

**Issue**: Can't load question sets

**Possible Causes**:
1. Invalid Supabase credentials
2. RLS policies not applied
3. Tables not created

**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Re-run the migration SQL in Supabase SQL Editor
- Check Supabase logs in Dashboard → Logs

### "No Questions Found" Error

**Issue**: Generated questions but can't load them

**Possible Causes**:
1. Code generator collision (rare)
2. Database write failed
3. RLS policy blocking reads

**Solution**:
- Check Vercel Function logs
- Verify RLS policies in Supabase (should allow public reads)

## Monitoring & Maintenance

### Check API Costs

**Anthropic Console**:
- Go to [console.anthropic.com](https://console.anthropic.com)
- Check "Usage" tab
- Approximate costs:
  - 20 questions: ~$0.12
  - 50 questions: ~$0.30
  - 100 questions: ~$0.48

### Database Usage

**Supabase Dashboard**:
- Check "Database" → "Usage"
- Free tier includes:
  - 500 MB database space
  - 1 GB file storage
  - 5 GB bandwidth

### Set Up Alerts

**Vercel**:
1. Go to Project Settings → Notifications
2. Enable email alerts for:
   - Deployment failures
   - Build errors

**Supabase**:
1. Go to Project Settings → Billing
2. Set spending limit to prevent overages

## Production Checklist

Before launching to real users:

- [ ] Test question generation with various materials (PDF, images, text)
- [ ] Test all difficulty levels
- [ ] Test variable question counts (20, 50, 100)
- [ ] Test code sharing across different devices
- [ ] Test all question types render correctly
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Verify API keys are not exposed in client code
- [ ] Check Supabase RLS policies are configured
- [ ] Test error handling (invalid codes, API failures)
- [ ] Set up monitoring/alerts
- [ ] Review API cost projections based on expected usage
- [ ] Add analytics (optional: Vercel Analytics, Posthog, etc.)

## Next Steps

Once deployed and tested:

1. **Share with test users** (friends, teachers, students)
2. **Gather feedback** on UX and question quality
3. **Monitor costs** - especially Anthropic API usage
4. **Plan Phase 2 features**:
   - Math, History, Society subjects
   - Additional question types
   - Browse/search functionality
   - Progress tracking (optional)

## Support

If you encounter issues:

1. Check Vercel logs: Dashboard → Functions → Logs
2. Check Supabase logs: Dashboard → Logs
3. Review error messages in browser console (F12)
4. Check this guide's Troubleshooting section

## Rollback Procedure

If you need to roll back a deployment:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

---

**Congratulations!** Your Exam Prepper app is now live! 🎉
