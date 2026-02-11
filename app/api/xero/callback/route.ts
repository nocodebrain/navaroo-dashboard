import { NextRequest, NextResponse } from 'next/server';
import { getXeroClient } from '@/lib/xero-client';
import { serialize } from 'cookie';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    const xeroClient = getXeroClient();
    
    // Exchange code for tokens
    const tokenSet = await xeroClient.apiCallback(url.toString());
    
    // Get tenant (organization) info
    const tenants = await xeroClient.updateTenants();
    const tenantId = tenants[0]?.tenantId;
    
    if (!tenantId) {
      return NextResponse.redirect(new URL('/?error=no_tenant', request.url));
    }

    // Store tokens and tenant in httpOnly cookies
    const response = NextResponse.redirect(new URL('/?xero=connected', request.url));
    
    response.headers.append(
      'Set-Cookie',
      serialize('xero_access_token', tokenSet.access_token || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 30, // 30 minutes
        path: '/',
      })
    );
    
    response.headers.append(
      'Set-Cookie',
      serialize('xero_refresh_token', tokenSet.refresh_token || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60, // 60 days
        path: '/',
      })
    );
    
    response.headers.append(
      'Set-Cookie',
      serialize('xero_tenant_id', tenantId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60, // 60 days
        path: '/',
      })
    );

    return response;
  } catch (error) {
    console.error('Error in Xero OAuth callback:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
