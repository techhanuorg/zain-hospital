import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsAdapter } from '@/lib/storage/google-sheets-adapter';

export async function GET() {
  try {
    const config = googleSheetsAdapter.getConfig();
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, webhookUrl, spreadsheetId, autoSync } = body;

    if (action === 'save' || action === 'update') {
      googleSheetsAdapter.updateConfig({
        webhookUrl,
        spreadsheetId,
        autoSync
      });
      return NextResponse.json({
        success: true,
        message: 'Google Sheets sync configuration updated!',
        config: googleSheetsAdapter.getConfig()
      });
    }

    if (action === 'test_ping') {
      if (webhookUrl) {
        googleSheetsAdapter.updateConfig({ webhookUrl });
      }
      const testRes = await googleSheetsAdapter.sendTestPing();
      return NextResponse.json(testRes);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
