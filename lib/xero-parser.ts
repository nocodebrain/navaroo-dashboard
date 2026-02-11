import * as XLSX from 'xlsx';

export interface XeroMonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  assets: number;
  liabilities: number;
  equity: number;
}

export interface XeroAccountRow {
  account: string;
  values: Record<string, number>;
}

export function parseXeroProfitLoss(file: ArrayBuffer): XeroMonthlyData[] {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Find the header row (contains "Account" and month names)
  let headerRowIndex = -1;
  let months: string[] = [];
  
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row[0] === 'Account' || row[0]?.toString().toLowerCase() === 'account') {
      headerRowIndex = i;
      // Extract month columns (skip first column which is "Account")
      months = row.slice(1).filter((col: any) => col && col !== '').map((col: any) => col.toString());
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Could not find header row with "Account" column');
  }

  // Section headers to skip (these are organizational rows, not actual accounts)
  const sectionHeaders = [
    'trading income',
    'cost of sales',
    'gross profit',
    'other income',
    'operating expenses',
    'other expenses',
    'less operating expenses',
    'net profit',
    'total trading income',
    'total cost of sales',
    'total operating expenses',
    'total other income'
  ];

  // Parse account rows
  const accounts: XeroAccountRow[] = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const accountName = row[0]?.toString().trim();
    
    if (!accountName || accountName === '') continue;
    
    // Skip section headers
    const accountLower = accountName.toLowerCase();
    if (sectionHeaders.some(header => accountLower === header || accountLower.includes('total ' + header))) {
      continue;
    }
    
    const values: Record<string, number> = {};
    months.forEach((month, index) => {
      const value = row[index + 1];
      const numValue = parseFloat(value);
      // Only add if it's a valid number
      values[month] = !isNaN(numValue) ? numValue : 0;
    });
    
    accounts.push({
      account: accountName,
      values
    });
  }

  // Calculate monthly summaries
  const monthlyData: XeroMonthlyData[] = [];
  
  months.forEach(month => {
    let revenue = 0;
    let expenses = 0;

    accounts.forEach(account => {
      const value = account.values[month] || 0;
      const accountLower = account.account.toLowerCase();
      
      // Revenue accounts (look for "sales", "interest income", etc.)
      if (accountLower.includes('sales') || 
          accountLower.includes('interest income') ||
          (accountLower.includes('income') && !accountLower.includes('cost'))) {
        revenue += Math.abs(value); // Use absolute value in case of negative revenues
      }
      // Expense accounts
      else if (value > 0 && (
               accountLower.includes('wage') ||
               accountLower.includes('salary') ||
               accountLower.includes('super') ||
               accountLower.includes('insurance') ||
               accountLower.includes('rent') ||
               accountLower.includes('equipment') ||
               accountLower.includes('hire') ||
               accountLower.includes('freight') ||
               accountLower.includes('incolink') ||
               accountLower.includes('professional') ||
               accountLower.includes('advertising') ||
               accountLower.includes('bank') ||
               accountLower.includes('depreciation') ||
               accountLower.includes('employee') ||
               accountLower.includes('marketing') ||
               accountLower.includes('motor') ||
               accountLower.includes('phone') ||
               accountLower.includes('postage') ||
               accountLower.includes('printing') ||
               accountLower.includes('protective') ||
               accountLower.includes('staff') ||
               accountLower.includes('subscription') ||
               accountLower.includes('telephone') ||
               accountLower.includes('tool') ||
               accountLower.includes('travel') ||
               accountLower.includes('workcover') ||
               accountLower.includes('cost')
             )) {
        expenses += value;
      }
    });

    const profit = revenue - expenses;

    monthlyData.push({
      month,
      revenue,
      expenses,
      profit,
      assets: 0,
      liabilities: 0,
      equity: 0
    });
  });

  return monthlyData; // Return in original order (newest first)
}

export function parseXeroBalanceSheet(file: ArrayBuffer): Record<string, { assets: number; liabilities: number; equity: number }> {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Find the header row (Balance Sheet format has Account in column 1)
  let headerRowIndex = -1;
  let months: string[] = [];
  
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    const col1 = row[1]?.toString().toLowerCase();
    if (col1 === 'account') {
      headerRowIndex = i;
      // Months start from column 2
      months = row.slice(2).filter((col: any) => col && col !== '').map((col: any) => col.toString());
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Could not find header row in Balance Sheet');
  }

  const result: Record<string, { assets: number; liabilities: number; equity: number }> = {};
  
  months.forEach(month => {
    result[month] = { assets: 0, liabilities: 0, equity: 0 };
  });

  // Parse balance sheet sections
  let currentSection: 'assets' | 'liabilities' | 'equity' | null = null;
  
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const label = (row[0] || '').toString().trim().toLowerCase();
    
    if (label === 'assets') {
      currentSection = 'assets';
    } else if (label.includes('liabilities')) {
      currentSection = 'liabilities';
    } else if (label === 'equity') {
      currentSection = 'equity';
    } else if (label.includes('total assets') || 
               label.includes('total liabilities') || 
               label.includes('total equity')) {
      // Sum row - use this for the section total
      if (currentSection) {
        months.forEach((month, index) => {
          const value = parseFloat(row[index + 2]) || 0;
          result[month][currentSection!] = Math.abs(value);
        });
      }
    }
  }

  return result;
}

export function mergeXeroData(plData: XeroMonthlyData[], bsData: Record<string, any>): XeroMonthlyData[] {
  return plData.map(monthData => {
    const balanceSheet = bsData[monthData.month] || { assets: 0, liabilities: 0, equity: 0 };
    return {
      ...monthData,
      assets: balanceSheet.assets,
      liabilities: balanceSheet.liabilities,
      equity: balanceSheet.equity
    };
  });
}
