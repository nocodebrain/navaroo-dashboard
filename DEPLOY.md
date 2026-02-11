# Deployment Guide - Navaroo Dashboard

## Quick Deploy to Railway

### Option 1: One-Click Deploy (Easiest)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `nocodebrain/navaroo-dashboard`
4. Railway auto-detects Next.js and deploys
5. Done! Your dashboard will be live at `https://navaroo-dashboard-production.up.railway.app`

### Option 2: Railway CLI

```bash
cd /data/.openclaw/workspace/navaroo-dashboard

# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project (or create new)
railway link

# Deploy
railway up
```

## Deploy to Vercel

```bash
cd /data/.openclaw/workspace/navaroo-dashboard

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or use the Vercel dashboard:
1. Import GitHub repo
2. Vercel auto-detects Next.js
3. Deploy

## Environment Variables (For Xero OAuth)

If you want direct Xero integration, add these to your deployment:

```
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=https://your-domain.com/api/xero/callback
```

### Railway Environment Variables:
1. Go to project → Settings → Variables
2. Add each variable
3. Redeploy

### Vercel Environment Variables:
1. Project Settings → Environment Variables
2. Add each variable
3. Redeploy

## Custom Domain (Optional)

### Railway:
1. Project → Settings → Domains
2. Add custom domain (e.g., `dashboard.navaroo.com.au`)
3. Update DNS with provided CNAME

### Vercel:
1. Project Settings → Domains
2. Add custom domain
3. Update DNS records

## Update After Changes

### If you edit code locally:

```bash
cd /data/.openclaw/workspace/navaroo-dashboard
git add .
git commit -m "Update dashboard"
git push
```

Railway and Vercel will auto-deploy from GitHub.

## Access Your Dashboard

After deployment:

**Railway:**
- `https://navaroo-dashboard-production.up.railway.app`
- Or your custom domain

**Vercel:**
- `https://navaroo-dashboard.vercel.app`
- Or your custom domain

## Monthly Updates

Two ways to keep your dashboard up-to-date:

### 1. Manual Upload (No Deploy Needed)
- Export P&L from Xero monthly
- Upload to dashboard
- Data updates instantly

### 2. Xero API (Auto-Sync)
- Set up Xero OAuth (see main README)
- Dashboard pulls latest data automatically
- No manual exports needed

## Troubleshooting

**Build fails:**
- Check build logs in Railway/Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try running `npm run build` locally first

**Dashboard loads but can't upload files:**
- Check browser console for errors
- Ensure you're using modern browser (Chrome, Firefox, Safari)
- Try different file if upload fails

**Xero connection fails:**
- Verify environment variables are set
- Check Xero redirect URL matches deployment URL
- Ensure Xero app is not in development mode

## Cost

**Railway:**
- Free tier: $5 credit/month
- This dashboard: ~$1-2/month
- No credit card needed for hobby tier

**Vercel:**
- Free tier: 100GB bandwidth/month
- More than enough for personal dashboard
- No credit card needed

Both platforms offer generous free tiers perfect for this dashboard.

---

Need help deploying? Let me know!
