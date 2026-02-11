# Navaroo & Visionex Solutions Dashboard

A modern business performance dashboard with monthly data upload functionality for Navaroo and Visionex Solutions.

## Features

✅ **Monthly Performance Overview**
- Revenue, expenses, and profit tracking
- Client metrics (active clients, new clients)
- Tender performance (submissions, wins, win rate)
- Profit margin calculations

✅ **File Upload System**
- Upload Excel files (.xlsx, .xls) to update monthly data
- Download template with correct column structure
- Automatic data parsing and validation
- Visual feedback on upload success/errors

✅ **Historical Data View**
- Table view of all historical months
- Track trends over time
- Easy-to-read financial summaries

✅ **Professional UI**
- Modern, responsive design
- Color-coded metrics (green = revenue/profit, red = expenses)
- Mobile-friendly layout
- Clear visual hierarchy

## How to Use

### 1. Download Template
Click the "Download Template" button to get an Excel file with the correct structure.

### 2. Fill in Your Data
The template includes these columns:
- **Month**: e.g., "January 2026"
- **Revenue**: Total monthly revenue
- **Expenses**: Total monthly expenses
- **Profit**: Net profit (Revenue - Expenses)
- **Active Clients**: Number of active clients
- **New Clients**: New clients acquired this month
- **Tenders Submitted**: Number of tenders submitted
- **Tenders Won**: Number of tenders won

### 3. Upload Data
Click "Upload Data" and select your completed Excel file. The dashboard will automatically update.

### 4. View Results
The dashboard displays:
- Current month's key metrics
- Profit margin percentage
- Tender win rate percentage
- Historical data table

## Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **XLSX** - Excel file parsing
- **Lucide React** - Icons

## Data Format

The Excel file should have these exact column names (case-insensitive):
- Month
- Revenue
- Expenses
- Profit
- Active Clients (or activeClients)
- New Clients (or newClients)
- Tenders Submitted (or tendersSubmitted)
- Tenders Won (or tendersWon)

## Future Enhancements

- PDF data extraction (requires backend processing)
- Data persistence (database integration)
- Charts and graphs for trend visualization
- Export functionality (PDF reports, Excel downloads)
- Multi-user authentication
- Data comparison (month-over-month, year-over-year)

## Deploy

### Vercel (Recommended)
1. Push to GitHub
2. Import repository in Vercel
3. Deploy with one click

### Railway
1. Push to GitHub
2. Create new project from GitHub repo
3. Railway auto-detects Next.js and deploys

## License

MIT

---

Built for Navaroo & Visionex Solutions by Rawana 🔱
