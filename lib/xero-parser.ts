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

  // Parse account rows
  const accounts: XeroAccountRow[] = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const accountName = row[0]?.toString().trim();
    
    if (!accountName || accountName === '') continue;
    if (accountName.toLowerCase().includes('total') && accountName.toLowerCase().includes('trading')) continue;
    if (accountName.toLowerCase().includes('total') && accountName.toLowerCase().includes('cost')) continue;
    if (accountName.toLowerCase().includes('total') && accountName.toLowerCase().includes('operating')) continue;
    
    const values: Record<string, number> = {};
    months.forEach((month, index) => {
      const value = row[index + 1];
      values[month] = parseFloat(value) || 0;
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
    let profit = 0;

    accounts.forEach(account => {
      const value = account.values[month] || 0;
      const accountLower = account.account.toLowerCase();
      
      // Revenue accounts
      if (accountLower.includes('sales') || 
          accountLower.includes('income') || 
          accountLower.includes('revenue')) {
        revenue += value;
      }
      // Expense accounts (but not revenue/income)
      else if (accountLower.includes('cost') ||
               accountLower.includes('expense') ||
               accountLower.includes('hire') ||
               accountLower.includes('insurance') ||
               accountLower.includes('wage') ||
               accountLower.includes('salary') ||
               accountLower.includes('rent') ||
               accountLower.includes('professional') ||
               accountLower.includes('fee') ||
               accountLower.includes('depreciation')) {
        expenses += Math.abs(value);
      }
      // Net Profit row
      else if (accountLower.includes('net profit') || accountLower.includes('net loss')) {
        profit = value;
      }
    });

    // If no explicit profit row, calculate it
    if (profit === 0) {
      profit = revenue - expenses;
    }

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

  return monthlyData.reverse(); // Newest first
}

export function parseXeroBalanceSheet(file: ArrayBuffer): Record<string, { assets: number; liabilities: number; equity: number }> {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Find the header row
  let headerRowIndex = -1;
  let months: string[] = [];
  
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row[1] === 'Account' || row[1]?.toString().toLowerCase() === 'account') {
      headerRowIndex = i;
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
    
    if (label === 'assets') currentSection = 'assets';
    else if (label.includes('liabilities')) currentSection = 'liabilities';
    else if (label === 'equity') currentSection = 'equity';
    else if (label.includes('total assets') || label.includes('total liabilities') || label.includes('total equity')) {
      // Sum row - use this for the section total
      if (currentSection) {
        months.forEach((month, index) => {
          const value = parseFloat(row[index + 2]) || 0;
          result[month][currentSection!] = value;
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
