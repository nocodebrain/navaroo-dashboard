import * as XLSX from 'xlsx';

export interface XeroMonthlyData {
  month: string;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  depreciation: number;
  ebitda: number;
  ebitdaMargin: number;
  expenses: number;
  profit: number;
  assets: number;
  currentAssets: number;
  liabilities: number;
  currentLiabilities: number;
  equity: number;
  accountsReceivable: number;
  accountsPayable: number;
  workingCapital: number;
  currentRatio: number;
  quickRatio: number;
  opexRatio: number;
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
    throw new Error('Could not find header row');
  }

  const accounts: XeroAccountRow[] = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const accountName = row[0]?.toString().trim();
    
    if (!accountName) continue;
    
    const values: Record<string, number> = {};
    months.forEach((month, index) => {
      const value = row[index + 1];
      const numValue = parseFloat(value);
      values[month] = !isNaN(numValue) ? numValue : 0;
    });
    
    accounts.push({ account: accountName, values });
  }

  const monthlyData: XeroMonthlyData[] = [];
  
  months.forEach(month => {
    let revenue = 0;
    let costOfSales = 0;
    let operatingExpenses = 0;
    let depreciation = 0;
    const expenseCategories: Map<string, number> = new Map();

    accounts.forEach(account => {
      const value = account.values[month] || 0;
      const accountLower = account.account.toLowerCase();
      
      // Revenue
      if (accountLower.includes('sales') || 
          accountLower.includes('interest income') ||
          (accountLower.includes('income') && !accountLower.includes('cost'))) {
        revenue += Math.abs(value);
      }
      // Cost of Sales
      else if (accountLower.includes('cost of') || 
               accountLower.includes('cost-of') ||
               accountLower.includes('cogs')) {
        costOfSales += Math.abs(value);
      }
      // Depreciation (for EBITDA)
      else if (accountLower.includes('depreciation') || accountLower.includes('amortization')) {
        depreciation += Math.abs(value);
        operatingExpenses += Math.abs(value);
      }
      // Operating Expenses
      else if (value > 0) {
        operatingExpenses += value;
        
        // Categorize
        if (accountLower.includes('wage') || accountLower.includes('salary')) {
          expenseCategories.set('Wages & Salaries', (expenseCategories.get('Wages & Salaries') || 0) + value);
        } else if (accountLower.includes('super')) {
          expenseCategories.set('Superannuation', (expenseCategories.get('Superannuation') || 0) + value);
        } else if (accountLower.includes('insurance') || accountLower.includes('incolink') || accountLower.includes('workcover')) {
          expenseCategories.set('Insurance', (expenseCategories.get('Insurance') || 0) + value);
        } else if (accountLower.includes('equipment') || accountLower.includes('hire') || accountLower.includes('tool')) {
          expenseCategories.set('Equipment & Tools', (expenseCategories.get('Equipment & Tools') || 0) + value);
        } else if (accountLower.includes('subscription')) {
          expenseCategories.set('Subscriptions', (expenseCategories.get('Subscriptions') || 0) + value);
        } else if (accountLower.includes('rent')) {
          expenseCategories.set('Rent', (expenseCategories.get('Rent') || 0) + value);
        } else if (accountLower.includes('professional')) {
          expenseCategories.set('Professional Services', (expenseCategories.get('Professional Services') || 0) + value);
        } else if (accountLower.includes('motor') || accountLower.includes('vehicle')) {
          expenseCategories.set('Vehicle', (expenseCategories.get('Vehicle') || 0) + value);
        } else {
          expenseCategories.set('Other', (expenseCategories.get('Other') || 0) + value);
        }
      }
    });

    const grossProfit = revenue - costOfSales;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const totalExpenses = costOfSales + operatingExpenses;
    const profit = revenue - totalExpenses;
    const ebitda = profit + depreciation;
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
    const opexRatio = revenue > 0 ? (operatingExpenses / revenue) * 100 : 0;

    const expenseBreakdown: ExpenseCategory[] = Array.from(expenseCategories.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    monthlyData.push({
      month,
      revenue,
      costOfSales,
      grossProfit,
      grossMargin,
      operatingExpenses,
      depreciation,
      ebitda,
      ebitdaMargin,
      expenses: totalExpenses,
      profit,
      assets: 0,
      currentAssets: 0,
      liabilities: 0,
      currentLiabilities: 0,
      equity: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      workingCapital: 0,
      currentRatio: 0,
      quickRatio: 0,
      opexRatio,
      expenseBreakdown
    });
  });

  return monthlyData;
}

export function parseXeroBalanceSheet(file: ArrayBuffer): Record<string, any> {
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
    return {};
  }

  const result: Record<string, any> = {};
  months.forEach(month => {
    result[month] = { 
      assets: 0, 
      currentAssets: 0,
      liabilities: 0, 
      currentLiabilities: 0,
      equity: 0,
      accountsReceivable: 0,
      accountsPayable: 0
    };
  });

  let currentSection: string | null = null;
  
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const label = (row[0] || '').toString().trim().toLowerCase();
    const accountName = (row[1] || '').toString().trim().toLowerCase();
    
    if (label === 'assets') {
      currentSection = 'assets';
    } else if (label.includes('current assets')) {
      currentSection = 'currentAssets';
    } else if (label.includes('liabilities')) {
      currentSection = 'liabilities';
    } else if (label.includes('current liabilities')) {
      currentSection = 'currentLiabilities';
    } else if (label === 'equity') {
      currentSection = 'equity';
    }
    
    // Capture accounts receivable
    if (accountName.includes('receivable') || accountName.includes('debtors')) {
      months.forEach((month, index) => {
        const value = parseFloat(row[index + 2]) || 0;
        result[month].accountsReceivable += Math.abs(value);
      });
    }
    
    // Capture accounts payable
    if (accountName.includes('payable') || accountName.includes('creditors')) {
      months.forEach((month, index) => {
        const value = parseFloat(row[index + 2]) || 0;
        result[month].accountsPayable += Math.abs(value);
      });
    }
    
    // Capture section totals
    if (label.includes('total assets') || 
        label.includes('total current assets') ||
        label.includes('total liabilities') || 
        label.includes('total current liabilities') ||
        label.includes('total equity')) {
      if (currentSection) {
        months.forEach((month, index) => {
          const value = parseFloat(row[index + 2]) || 0;
          result[month][currentSection!] = Math.abs(value);
        });
      }
    }
  }

  // Calculate working capital and ratios
  months.forEach(month => {
    const data = result[month];
    data.workingCapital = data.currentAssets - data.currentLiabilities;
    data.currentRatio = data.currentLiabilities > 0 ? data.currentAssets / data.currentLiabilities : 0;
    data.quickRatio = data.currentLiabilities > 0 
      ? (data.currentAssets - 0) / data.currentLiabilities 
      : 0;
  });

  return result;
}

export function mergeXeroData(plData: XeroMonthlyData[], bsData: Record<string, any>): XeroMonthlyData[] {
  return plData.map(monthData => {
    const bs = bsData[monthData.month] || {};
    return {
      ...monthData,
      assets: bs.assets || 0,
      currentAssets: bs.currentAssets || 0,
      liabilities: bs.liabilities || 0,
      currentLiabilities: bs.currentLiabilities || 0,
      equity: bs.equity || 0,
      accountsReceivable: bs.accountsReceivable || 0,
      accountsPayable: bs.accountsPayable || 0,
      workingCapital: bs.workingCapital || 0,
      currentRatio: bs.currentRatio || 0,
      quickRatio: bs.quickRatio || 0
    };
  });
}
