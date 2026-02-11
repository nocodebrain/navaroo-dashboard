# Navaroo & Visionex Solutions Dashboard

Business performance dashboard that **automatically parses Xero exports** with support for direct Xero API integration.

## ✅ What's Working Now

### Upload Your Xero Files
No templates, no manual data entry. Just upload your existing Xero exports:

1. **Export from Xero:**
   - Go to Reports → Profit and Loss
   - Select date range (e.g., last 12 or 24 months)
   - Click "Export" → Excel (.xlsx)
   - Repeat for Balance Sheet (optional)

2. **Upload to Dashboard:**
   - Click "Upload Xero Files"
   - Select your P&L file (and Balance Sheet if you have it)
   - Dashboard automatically parses and displays all data

3. **View Your Data:**
   - Current month overview (Revenue, Expenses, Profit, Margin %)
   - Balance Sheet summary (Assets, Liabilities, Equity)
   - Historical table with all months from your export

### Supported Xero Reports

- ✅ **Profit & Loss** (full monthly breakdown)
- ✅ **Balance Sheet** (assets, liabilities, equity)
- ✅ Automatically detects account types (revenue vs expenses)
- ✅ Calculates profit margins
- ✅ Displays 24+ months of historical data

## 🔗 Direct Xero Integration (Optional)

For automatic monthly updates without manual exports:

### Setup Requirements:
1. Xero Developer Account
2. OAuth 2.0 app credentials
3. Environment variables configuration

### Steps to Connect:
1. Go to [developer.xero.com](https://developer.xero.com/app/manage)
2. Create new app (OAuth 2.0)
3. Add redirect URL: `http://localhost:3005/api/xero/callback`
4. Enable scope: `accounting.reports.read`
5. Get Client ID and Client Secret
6. Add to `.env.local`:
   ```
   XERO_CLIENT_ID=your_client_id
   XERO_CLIENT_SECRET=your_client_secret
   XERO_REDIRECT_URI=http://localhost:3005/api/xero/callback
   ```
7. Click "Connect Xero" in dashboard
8. Authorize access

Once connected, the dashboard will automatically pull your latest Xero data monthly.

## Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3005
```

## Deploy

### Vercel (Recommended for Xero OAuth)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables (Xero credentials)
4. Update Xero redirect URL to your production domain
5. Deploy

### Railway
1. Push to GitHub
2. Create new project from repo
3. Add environment variables
4. Railway auto-deploys

## Features

- 📊 **Revenue & Expenses Tracking** - Automatic categorization from Xero
- 💰 **Profit Margin Calculation** - Real-time profitability metrics
- 🏗️ **Balance Sheet Overview** - Assets, liabilities, equity at a glance
- 📅 **Historical Data Table** - View trends over 12-24 months
- 📤 **File Upload** - Drag & drop or click to upload Xero exports
- 🔗 **Xero API Integration** - Optional direct sync (coming soon)
- 📱 **Mobile Responsive** - Works on all devices

## Data Privacy

- Files are processed client-side (browser only)
- No data sent to external servers unless Xero OAuth is enabled
- Xero OAuth only requests `accounting.reports.read` (read-only)
- No data storage on our servers (all calculations done in browser)

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Modern UI styling
- **XLSX** - Excel file parsing
- **Lucide React** - Icon library
- **Xero API** - Direct accounting integration (optional)

## File Format

The dashboard automatically parses standard Xero exports:

**Profit & Loss Format:**
- Header row with "Account" and month names
- Revenue rows (Sales, Income accounts)
- Expense rows (Wages, Rent, Insurance, etc.)
- Automatically skips section totals and headers

**Balance Sheet Format:**
- Header row with "Account" and dates
- Assets section
- Liabilities section
- Equity section

No special formatting needed - just export from Xero as-is.

## Troubleshooting

**"Could not find header row"**
- Make sure you're uploading a Xero report (not a custom Excel file)
- File should have "Account" as the first column header

**"No valid Xero data found"**
- Check that the file contains monthly columns (Jan 2026, Feb 2026, etc.)
- Try exporting with a different date range

**Revenue shows as $0**
- Check that your P&L has "Sales" or "Income" accounts
- The parser looks for keywords like "sales", "income", "interest income"

**Xero OAuth not working**
- Verify environment variables are set correctly
- Check redirect URL matches exactly in Xero app settings
- Make sure app has `accounting.reports.read` scope enabled

## Support

Questions or issues? Open an issue on GitHub or contact Hash.

---

Built for Navaroo & Visionex Solutions by Rawana 🔱
