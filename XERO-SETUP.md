# Xero Integration Setup

## ✅ Dashboard Deployed to Railway

Your dashboard is being deployed to Railway now. It will be available at:
**https://navaroo-dashboard-production.up.railway.app** (or similar)

## 🔑 Step 1: Complete Xero App Setup

You're creating the Xero app now. Here's what to do:

### In the Xero Developer Portal:

1. **App name:** Navaroo Dashboard (or whatever you chose)

2. **Integration type:** ✅ **Web app** (already selected)

3. **Company or application URL:** 
   - You can leave blank for now, or put: `https://navaroo.com.au`

4. **OAuth 2.0 redirect URI:** This is CRITICAL - add this URL:
   ```
   https://navaroo-dashboard-production.up.railway.app/api/xero/callback
   ```
   *(We'll confirm the exact Railway URL in a moment)*

5. **Check the terms box**

6. **Click "Create app"**

### After Creating the App:

You'll see your credentials:
- **Client ID** (looks like: `ABC123XYZ...`)
- **Client Secret** (looks like: `abc123def456...`)

**📋 Copy both of these - you'll need them next.**

---

## 🚀 Step 2: Configure Railway Environment Variables

Once your dashboard finishes deploying:

1. Go to Railway dashboard: https://railway.app/dashboard

2. Find your **navaroo-dashboard** project

3. Click on the service

4. Go to **Variables** tab

5. Add these three variables:

```
XERO_CLIENT_ID=paste_your_client_id_here
XERO_CLIENT_SECRET=paste_your_client_secret_here
XERO_REDIRECT_URI=https://navaroo-dashboard-production.up.railway.app/api/xero/callback
```

6. Click **Deploy** after adding variables

---

## 🎯 Step 3: Connect Xero

1. Open your dashboard: `https://navaroo-dashboard-production.up.railway.app`

2. Click **"Connect Xero"** button

3. You'll be redirected to Xero to authorize access

4. Select your Navaroo/Visionex organization

5. Click **"Allow access"**

6. You'll be redirected back to your dashboard

7. Dashboard will automatically load your Profit & Loss data!

---

## 📊 Step 4: Use Your Dashboard

Once connected:

- **Current month overview** shows latest revenue, expenses, profit
- **Historical table** shows all months from Xero
- **Click "Refresh from Xero"** anytime to get updated data
- **No manual exports needed!**

---

## 🔒 What Access Does the Dashboard Have?

**Read-only access to:**
- Profit & Loss reports
- Balance Sheet reports
- Organization settings

**Cannot:**
- Create invoices
- Modify transactions
- Delete anything
- Access bank accounts

---

## 🛠️ Troubleshooting

### "Failed to connect to Xero"
- Check that environment variables are set correctly in Railway
- Verify redirect URI matches exactly (including https://)
- Make sure Xero app is not in "development mode"

### "No data showing after connecting"
- Click "Refresh from Xero" button
- Check browser console for errors
- Verify your Xero account has transaction history

### "Redirect URI mismatch"
- Go back to Xero Developer Portal
- Edit your app
- Make sure redirect URI is EXACTLY: `https://[your-railway-url]/api/xero/callback`

---

## 📞 Need Help?

Let me know if:
- Railway URL is different than expected
- You get any errors during Xero connection
- Data isn't loading correctly
- You want to add more features

---

Built by Rawana 🔱
