import * as XLSX from 'xlsx';

export interface XeroMonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  assets: number;
  liabilities: number;
  equity: number;
  expenseBreakdown?: ExpenseCategory[];
}

export interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
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

  // Find the header row
  let headerRowIndex = -1;
  let months: string[] = [];
  
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row[0] === 'Account' || row[0]?.toString().toLowerCase() === 'account') {
      headerRowIndex = i;
      months = row.slice(1).filter((col: any) => col && col !== '').map((col: any) => col.toString());
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Could not find header row with "Account" column');
  }

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

  // Parse accounts with categories
  const accounts: XeroAccountRow[] = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const accountName = row[0]?.toString().trim();
    
    if (!accountName || accountName === '') continue;
    
    const accountLower = accountName.toLowerCase();
    if (sectionHeaders.some(header => accountLower === header || accountLower.includes('total ' + header))) {
      continue;
    }
    
    const values: Record<string, number> = {};
    months.forEach((month, index) => {
      const value = row[index + 1];
      const numValue = parseFloat(value);
      values[month] = !isNaN(numValue) ? numValue : 0;
    });
    
    accounts.push({
      account: accountName,
      values
    });
  }

  // Calculate monthly summaries with detailed expense breakdown
  const monthlyData: XeroMonthlyData[] = [];
  
  months.forEach(month => {
    let revenue = 0;
    let expenses = 0;
    const expenseCategories: Map<string, number> = new Map();

    accounts.forEach(account => {
      const value = account.values[month] || 0;
      const accountLower = account.account.toLowerCase();
      
      // Revenue accounts
      if (accountLower.includes('sales') || 
          accountLower.includes('interest income') ||
          (accountLower.includes('income') && !accountLower.includes('cost'))) {
        revenue += Math.abs(value);
      }
      // Expense accounts - categorize them
      else if (value > 0) {
        expenses += value;
        
        // Categorize expenses
        if (accountLower.includes('wage') || accountLower.includes('salary')) {
          expenseCategories.set('Wages & Salaries', (expenseCategories.get('Wages & Salaries') || 0) + value);
        } else if (accountLower.includes('super')) {
          expenseCategories.set('Superannuation', (expenseCategories.get('Superannuation') || 0) + value);
        } else if (accountLower.includes('insurance') || accountLower.includes('incolink') || accountLower.includes('workcover')) {
          expenseCategories.set('Insurance', (expenseCategories.get('Insurance') || 0) + value);
        } else if (accountLower.includes('equipment') || accountLower.includes('hire') || accountLower.includes('tool')) {
          expenseCategories.set('Equipment & Tools', (expenseCategories.get('Equipment & Tools') || 0) + value);
        } else if (accountLower.includes('subscription')) {
          expenseCategories.set('Subscriptions & Software', (expenseCategories.get('Subscriptions & Software') || 0) + value);
        } else if (accountLower.includes('rent')) {
          expenseCategories.set('Rent', (expenseCategories.get('Rent') || 0) + value);
        } else if (accountLower.includes('professional') || accountLower.includes('legal') || accountLower.includes('accounting')) {
          expenseCategories.set('Professional Services', (expenseCategories.get('Professional Services') || 0) + value);
        } else if (accountLower.includes('motor') || accountLower.includes('vehicle') || accountLower.includes('fuel')) {
          expenseCategories.set('Vehicle & Transport', (expenseCategories.get('Vehicle & Transport') || 0) + value);
        } else if (accountLower.includes('marketing') || accountLower.includes('advertising')) {
          expenseCategories.set('Marketing', (expenseCategories.get('Marketing') || 0) + value);
        } else if (accountLower.includes('depreciation')) {
          expenseCategories.set('Depreciation', (expenseCategories.get('Depreciation') || 0) + value);
        } else if (accountLower.includes('freight') || accountLower.includes('delivery')) {
          expenseCategories.set('Freight & Delivery', (expenseCategories.get('Freight & Delivery') || 0) + value);
        } else if (accountLower.includes('staff') || accountLower.includes('training') || accountLower.includes('welfare')) {
          expenseCategories.set('Staff Development', (expenseCategories.get('Staff Development') || 0) + value);
        } else if (accountLower.includes('protective') || accountLower.includes('clothing')) {
          expenseCategories.set('Safety & PPE', (expenseCategories.get('Safety & PPE') || 0) + value);
        } else {
          expenseCategories.set('Other Expenses', (expenseCategories.get('Other Expenses') || 0) + value);
        }
      }
    });

    const profit = revenue - expenses;

    // Convert expense categories to array with percentages
    const expenseBreakdown: ExpenseCategory[] = Array.from(expenseCategories.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: expenses > 0 ? (amount / expenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    monthlyData.push({
      month,
      revenue,
      expenses,
      profit,
      assets: 0,
      liabilities: 0,
      equity: 0,
      expenseBreakdown
    });
  });

  return monthlyData;
}

export function parseXeroBalanceSheet(file: ArrayBuffer): Record<string, { assets: number; liabilities: number; equity: number }> {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  let headerRowIndex = -1;
  let months: string[] = [];
  
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    const col1 = row[1]?.toString().toLowerCase();
    if (col1 === 'account') {
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
