"use client";

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Users, Send } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => setCampaigns(data.campaigns || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Health Outreach & Broadcast Campaigns</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated screening drives, vaccination reminders, and patient wellness alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((c) => (
          <div key={c.campaign_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                <p className="text-xs text-teal-700 font-mono mt-0.5">{c.type} • {c.target_audience}</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {c.status}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
              {c.message_template}
            </div>

            <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Recipients: <strong className="text-slate-800">{c.total_recipients}</strong></span>
              <span>Scheduled: <strong className="text-slate-800">{new Date(c.scheduled_at).toLocaleDateString()}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
