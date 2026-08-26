import { NextRequest, NextResponse } from 'next/server';
import { campaignRepo } from '@/lib/storage/repositories';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp_apex_01';
  const campaigns = await campaignRepo.listByHospital(hospitalId);
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const camp = await campaignRepo.create(body);
    return NextResponse.json({ success: true, campaign: camp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
