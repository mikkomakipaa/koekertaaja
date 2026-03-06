# Koekertaaja - Vercel Deployment Guide

This guide will help you deploy Koekertaaja to Vercel.

## Prerequisites

Before deploying, ensure you have:

1. ✅ **GitHub repository** with the latest code
2. ✅ **Vercel account** - Sign up at [vercel.com](https://vercel.com)
3. ✅ **Supabase project** - Set up at [supabase.com](https://supabase.com)
4. ✅ **Anthropic API key** - Get from [console.anthropic.com](https://console.anthropic.com)

## Step-by-Step Deployment

### 1. Prepare Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **Keep this secret!**

4. Navigate to **SQL Editor**
5. Run the migration file: `supabase/migrations/20250103_initial_schema.sql`
6. Verify tables are created: `question_sets` and `questions`

### 2. Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository: `mikkomakipaa/exam-prepper`
4. Click **"Import"**

### 3. Configure Environment Variables

In the Vercel deployment configuration, add these environment variables:

#### Required Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api...

# App URL (optional, auto-set by Vercel)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important Notes:**
- Replace `xxxxx` with your actual Supabase project ID
- Replace the keys with your actual Supabase and Anthropic keys
- **NEVER commit these keys to Git**
- The `NEXT_PUBLIC_APP_URL` will be auto-set by Vercel after first deployment

### 4. Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-4 minutes)
3. Once deployed, you'll get a URL like: `https://exam-prepper.vercel.app`

### 5. Verify Deployment

1. **Visit your deployed app** - Click the deployment URL
2. **Test creating a question set**:
   - Click "Luo uusi koealue"
   - Fill in the form with test data
   - Upload a sample PDF or text
   - Verify questions are generated
3. **Test playing a quiz**:
   - Click "Aloita harjoittelu"
   - Select a question set
   - Verify points and streaks work
   - Complete a quiz and check results

## Deployment Settings

### Build Settings (Auto-configured by Vercel)

```
Framework: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

### Performance Optimizations

The app is already optimized for Vercel:
- ✅ Static generation for landing pages
- ✅ Dynamic rendering for quiz pages
- ✅ API routes are serverless functions
- ✅ Automatic code splitting
- ✅ Image optimization (built-in Next.js)

### Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to **Domains**
3. Click **"Add Domain"**
4. Follow instructions to configure DNS

## Environment Variables Checklist

Use this checklist when setting up environment variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret!)
- [ ] `ANTHROPIC_API_KEY` - Anthropic API key (secret!)
- [ ] `NEXT_PUBLIC_APP_URL` - Your Vercel app URL (optional)

## Troubleshooting

### Build Fails

**Error: Type checking failed**
```bash
# Run locally to check for errors:
npm run typecheck
npm run build
```

**Error: Missing environment variables**
- Double-check all environment variables are set in Vercel
- Ensure no typos in variable names
- Verify keys are valid and not expired

### Runtime Errors

**Error: Failed to fetch from Supabase**
- Verify Supabase URL and keys are correct
- Check Row Level Security (RLS) policies are enabled
- Ensure migration was run successfully

**Error: Anthropic API fails**
- Verify API key is correct
- Check API key has sufficient credits
- Ensure model name is correct: `claude-sonnet-4-20250514`

**Error: Questions not generating**
- Check Vercel function logs: **Deployments → [Your deployment] → Functions**
- Verify file upload limits: `serverActions.bodySizeLimit: '10mb'` in `next.config.js`
- Test with smaller files first

## Monitoring

### Vercel Analytics (Optional)

1. Go to your project in Vercel
2. Navigate to **Analytics**
3. Enable **Web Analytics** for free
4. Monitor:
   - Page views
   - Performance metrics
   - Error rates

### Supabase Monitoring

1. Go to Supabase dashboard
2. Navigate to **Database → Logs**
3. Monitor query performance and errors

## Updates and Redeployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Vercel will:
1. Detect the push
2. Run build automatically
3. Deploy to production
4. Keep previous deployment as rollback

### Manual Redeploy

1. Go to Vercel dashboard
2. Navigate to **Deployments**
3. Click **"Redeploy"** on any previous deployment

### Rollback

If something breaks:
1. Go to **Deployments**
2. Find a working previous deployment
3. Click **"..."** → **"Promote to Production"**

## Production Checklist

Before going live:

- [ ] All environment variables are set
- [ ] Database migration is complete
- [ ] Test creating question sets
- [ ] Test playing quizzes
- [ ] Test on mobile devices
- [ ] Verify points and achievements work
- [ ] Check footer GitHub link works
- [ ] Test with different file types (PDF, images, text)
- [ ] Verify sharing codes work
- [ ] Check error handling
- [ ] Review Vercel function logs

## Security Best Practices

- ✅ API keys are stored in Vercel environment variables (never in code)
- ✅ Service role key is used server-side only
- ✅ Row Level Security (RLS) enabled on Supabase
- ✅ No authentication = no user data to protect
- ✅ File uploads limited to 10MB
- ✅ Input validation on all forms

## Cost Considerations

### Vercel Pricing

**Hobby Plan (Free)**:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless function executions included
- ✅ Perfect for testing and small-scale use

**Pro Plan ($20/month)**:
- Higher bandwidth limits
- More function execution time
- Team features

### Supabase Pricing

**Free Tier**:
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 50,000 monthly active users
- ✅ Sufficient for moderate use

### Anthropic Pricing

- Pay per token
- Claude Sonnet 4: ~$3-15 per million tokens
- Cost per question set: ~$0.02-0.10 depending on size

**Cost Optimization Tips**:
- Limit question count to 20-50 for most users
- Monitor API usage in Anthropic console
- Set up usage alerts

## Support

- **Vercel Issues**: [vercel.com/support](https://vercel.com/support)
- **Supabase Issues**: [supabase.com/support](https://supabase.com/support)
- **App Issues**: Open an issue on [GitHub](https://github.com/mikkomakipaa/exam-prepper/issues)

## Success!

Once deployed, share your app:
- Direct link: `https://your-app.vercel.app`
- Share question set codes with students
- Monitor usage via Vercel Analytics

---

**Deployed successfully?** Don't forget to update the `NEXT_PUBLIC_APP_URL` in your environment variables with your actual Vercel URL! 🚀
