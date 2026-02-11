# Navaroo CFO Financial Dashboard

Professional-grade financial dashboard for Navaroo Pty Ltd with comprehensive CFO metrics, built with Next.js 15, TypeScript, and Tailwind CSS.

## ✨ Features

### 📊 Core Financial Metrics
- **Revenue** - Total monthly income with MoM/YoY comparison
- **Gross Profit & Margin** - Revenue minus cost of sales
- **EBITDA & EBITDA Margin** - Earnings before interest, taxes, depreciation, amortization
- **Net Profit** - Bottom line profitability
- **Operating Expense Ratio (OpEx)** - Operating expenses as % of revenue

### 💰 Balance Sheet Metrics
- **Working Capital** - Current assets minus current liabilities
- **Current Ratio** - Liquidity indicator (current assets / current liabilities)
- **Quick Ratio** - Liquidity excluding inventory
- **Accounts Receivable** - Money owed by customers
- **Accounts Payable** - Money owed to suppliers

### 📈 Visualizations
- **Revenue vs Expenses Trend** - 12-month line chart
- **Expense Breakdown** - Pie chart with detailed categories
  - Wages & Salaries
  - Superannuation
  - Insurance
  - Equipment & Tools
  - Subscriptions
  - Rent
  - Professional Services
  - Vehicle & Transport
  - Other
- **Forecast Model** - Project future revenue and see impact

### 🎛️ Interactive Controls
- **Month Selector** - Navigate through historical data
- **MoM / YoY Toggle** - Compare month-over-month or year-over-year
- **Upload Data** - Drag & drop Xero Excel exports
- **Real-time Updates** - All metrics recalculate instantly

## 🎨 Design

### Professional UI
- **Dark Navy Sidebar** (#0f172a) with clean navigation
- **Light Content Area** (#f8fafc) for optimal readability
- **Inter Font** - Professional Google Font with proper weights
- **Color-Coded KPIs** - Green borders for revenue, red for expenses, blue for cash
- **Conditional Formatting** - Green for positive trends, red for negative
- **Stripe/Xero Style** - Modern SaaS aesthetic

### Accessibility
- High contrast text (dark #1a1a2e on light backgrounds)
- Proper font hierarchy (bold headers, prominent values)
- Responsive design (mobile, tablet, desktop)
- Smooth transitions and hover states

## 📂 Data Upload

### Supported Formats
Upload **Xero Excel exports** in either order:
1. **Profit & Loss** - Monthly P&L statement
2. **Balance Sheet** - Monthly balance sheet

### Export from Xero
1. Go to **Reports** → **Profit and Loss**
2. Select date range (e.g., last 12-24 months)
3. Click **Export** → **Excel**
4. Repeat for **Balance Sheet** (optional but recommended)
5. Upload both files to dashboard

### Auto-Detection
The parser automatically:
- Detects file type (P&L vs Balance Sheet)
- Extracts monthly columns
- Categorizes revenue, cost of sales, operating expenses
- Calculates all metrics
- Handles Xero's specific format

## 🚀 Getting Started

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

### Production Deployment

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Railway
1. Push to GitHub
2. Connect repository in Railway
3. Deploy automatically

## 📊 Metrics Explained

### Gross Profit & Margin
- **Gross Profit** = Revenue - Cost of Sales
- **Gross Margin %** = (Gross Profit / Revenue) × 100
- Indicates production/service delivery efficiency

### EBITDA & Margin
- **EBITDA** = Net Profit + Depreciation + Amortization
- **EBITDA Margin %** = (EBITDA / Revenue) × 100
- Operating profitability before financing and accounting decisions

### Operating Expense Ratio
- **OpEx Ratio** = (Operating Expenses / Revenue) × 100
- Lower is better - measures operational efficiency

### Current Ratio
- **Current Ratio** = Current Assets / Current Liabilities
- Should be > 1.0 (ideally 1.5-2.0)
- Measures ability to pay short-term obligations

### Quick Ratio
- **Quick Ratio** = (Current Assets - Inventory) / Current Liabilities
- More conservative than current ratio
- Should be > 1.0

### Working Capital
- **Working Capital** = Current Assets - Current Liabilities
- Positive = more assets than liabilities (good)
- Measures short-term financial health

## 🔧 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - React charting library
- **XLSX** - Excel file parsing
- **Inter Font** - Professional Google Font

## 📁 Project Structure

```
navaroo-dashboard/
├── app/
│   ├── page.tsx          # Main dashboard component
│   ├── layout.tsx        # Root layout with Inter font
│   └── globals.css       # Global styles
├── lib/
│   └── xero-parser.ts    # Xero file parsing logic
├── public/               # Static assets
└── README.md            # This file
```

## 🐛 Troubleshooting

### No Data Showing
- Ensure you uploaded a **Xero Profit & Loss export**
- File must be `.xlsx` or `.xls` format
- Check that file has "Account" column header

### Incorrect Calculations
- Verify Xero export has monthly columns (e.g., "Jan 2026", "Feb 2026")
- Balance Sheet is optional but needed for liquidity ratios
- Some metrics require both P&L and Balance Sheet

### Font Issues
- Inter font loads from Google Fonts automatically
- If font doesn't load, check internet connection
- Fallback to system fonts (San Francisco, Segoe UI)

## 📈 Future Enhancements

- [ ] Multi-year comparison
- [ ] Budget vs actual tracking
- [ ] Cash flow forecasting
- [ ] Scenario planning
- [ ] PDF export
- [ ] Direct Xero API integration
- [ ] Custom date ranges
- [ ] Department/project breakdowns

## 📄 License

MIT

---

**Built for Navaroo Pty Ltd by Rawana 🔱**

For support or feature requests, contact Hash.
