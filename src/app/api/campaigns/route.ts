import { NextRequest, NextResponse } from 'next/server';
import { campaignRepo, patientRepo } from '@/lib/storage/repositories';
import { campaignDispatcher } from '@/lib/whatsapp/campaign-dispatcher';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp_apex_01';
  const campaigns = await campaignRepo.listByHospital(hospitalId);
  const activeStatuses = campaignDispatcher.getAllStatuses();
  return NextResponse.json({ campaigns, activeStatuses });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, campaignId, hospitalId = 'hosp_apex_01' } = body;

    // Action to safely launch campaign with anti-ban pacing
    if (action === 'launch') {
      const campaign = await campaignRepo.getById(campaignId);
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      // Fetch target audience patients
      const patients = await patientRepo.listByHospital(hospitalId);
      const recipients = patients.map(p => ({
        phone: p.phone,
        name: p.name,
      }));

      const dispatchRes = await campaignDispatcher.dispatchCampaign(campaign, recipients);
      return NextResponse.json({
        success: true,
        message: `Campaign launched with Anti-Ban token pacing for ${recipients.length} patients!`,
        scheduledCount: dispatchRes.totalScheduled,
      });
    }

    const camp = await campaignRepo.create(body);
    return NextResponse.json({ success: true, campaign: camp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
