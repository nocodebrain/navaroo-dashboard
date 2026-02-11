import { XeroClient } from 'xero-node';

export function getXeroClient() {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: 'accounting.reports.read accounting.settings.read'.split(' '),
  });
}

export async function getXeroProfitLoss(xeroClient: XeroClient, tenantId: string, fromDate: string, toDate: string) {
  try {
    const response = await xeroClient.accountingApi.getReportProfitAndLoss(
      tenantId,
      fromDate,
      toDate,
      undefined,
      'MONTH'
    );
    return response.body.reports?.[0];
  } catch (error) {
    console.error('Error fetching Profit & Loss:', error);
    throw error;
  }
}

export async function getXeroBalanceSheet(xeroClient: XeroClient, tenantId: string, date: string) {
  try {
    const response = await xeroClient.accountingApi.getReportBalanceSheet(
      tenantId,
      date,
      undefined,
      'MONTH'
    );
    return response.body.reports?.[0];
  } catch (error) {
    console.error('Error fetching Balance Sheet:', error);
    throw error;
  }
}
