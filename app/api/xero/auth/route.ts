import { NextRequest, NextResponse } from 'next/server';
import { getXeroClient } from '@/lib/xero-client';

export async function GET(request: NextRequest) {
  try {
    const xeroClient = getXeroClient();
    const consentUrl = await xeroClient.buildConsentUrl();
    
    return NextResponse.redirect(consentUrl);
  } catch (error) {
    console.error('Error initiating Xero OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Xero connection' },
      { status: 500 }
    );
  }
}
