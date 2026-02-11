import { NextRequest, NextResponse } from 'next/server';
import { getXeroClient, getXeroProfitLoss, getXeroBalanceSheet } from '@/lib/xero-client';
import { parse } from 'cookie';

interface XeroRow {
  cells?: Array<{ value?: string; attributes?: Array<{ value?: string; id?: string }> }>;
  rowType?: string;
  rows?: XeroRow[];
}

function parseXeroReport(report: any) {
  const rows: XeroRow[] = report?.rows || [];
  const months: string[] = [];
  const data: any[] = [];

  // Find header row with month names
  const headerRow = rows.find((row: XeroRow) => 
    row.rowType === 'Header' && row.cells && row.cells.length > 1
  );

  if (headerRow?.cells) {
    // Skip first cell (account name), rest are months
    for (let i = 1; i < headerRow.cells.length; i++) {
      const cell = headerRow.cells[i];
      if (cell.value) {
        months.push(cell.value);
      }
    }
  }

  // Initialize data structure for each month
  months.forEach(month => {
    data.push({
      month,
      revenue: 0,
      expenses: 0,
      profit: 0
    });
  });

  // Parse account rows
  function parseRows(rows: XeroRow[], isExpense: boolean = false) {
    rows.forEach(row => {
      if (row.rowType === 'Row' && row.cells && row.cells.length > 1) {
        const accountName = row.cells[0]?.value?.toLowerCase() || '';
        
        // Check if this is a revenue or expense account
        const isRevenue = accountName.includes('sales') || 
                         accountName.includes('income') ||
                         accountName.includes('revenue');
        
        const isExpenseAccount = isExpense || 
                                accountName.includes('expense') ||
                                accountName.includes('cost') ||
                                accountName.includes('wage') ||
                                accountName.includes('salary');

        // Parse values for each month
        for (let i = 1; i < row.cells.length && i <= months.length; i++) {
          const value = parseFloat(row.cells[i]?.value || '0');
          const monthIndex = i - 1;

          if (isRevenue && value !== 0) {
            data[monthIndex].revenue += Math.abs(value);
          } else if (isExpenseAccount && value !== 0) {
            data[monthIndex].expenses += Math.abs(value);
          }
        }
      }

      // Recursively parse nested sections
      if (row.rows && row.rows.length > 0) {
        const sectionName = row.cells?.[0]?.value?.toLowerCase() || '';
        const isExpenseSection = sectionName.includes('expense') || 
                                sectionName.includes('cost of sales');
        parseRows(row.rows, isExpenseSection);
      }
    });
  }

  // Start parsing from sections
  const sections = rows.filter((row: XeroRow) => row.rowType === 'Section');
  sections.forEach(section => {
    if (section.rows) {
      const sectionTitle = section.cells?.[0]?.value?.toLowerCase() || '';
      const isExpenseSection = sectionTitle.includes('expense') || 
                              sectionTitle.includes('operating');
      parseRows(section.rows, isExpenseSection);
    }
  });

  // Calculate profit
  data.forEach(monthData => {
    monthData.profit = monthData.revenue - monthData.expenses;
  });

  return data;
}

export async function GET(request: NextRequest) {
  try {
    // Get tokens from cookies
    const cookies = parse(request.headers.get('cookie') || '');
    const accessToken = cookies.xero_access_token;
    const tenantId = cookies.xero_tenant_id;

    if (!accessToken || !tenantId) {
      return NextResponse.json(
        { error: 'Not authenticated with Xero' },
        { status: 401 }
      );
    }

    const xeroClient = getXeroClient();
    xeroClient.setTokenSet({
      access_token: accessToken,
      refresh_token: cookies.xero_refresh_token,
      token_type: 'Bearer',
      expires_in: 1800
    });

    // Fetch last 12 months
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 12);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Fetch Profit & Loss
    const plReport = await getXeroProfitLoss(
      xeroClient,
      tenantId,
      formatDate(fromDate),
      formatDate(toDate)
    );

    // Parse the report
    const data = parseXeroReport(plReport);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching Xero reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Xero data', details: error.message },
      { status: 500 }
    );
  }
}
