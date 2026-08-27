"use client";

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Users, Send, ShieldCheck, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeStatuses, setActiveStatuses] = useState<any[]>([]);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  const fetchCampaigns = () => {
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        setCampaigns(data.campaigns || []);
        setActiveStatuses(data.activeStatuses || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async (campaignId: string) => {
    setLaunchingId(campaignId);
    setNotification(null);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'launch', campaignId })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ success: true, message: data.message });
      } else {
        setNotification({ success: false, message: data.error });
      }
      fetchCampaigns();
    } catch (err: any) {
      setNotification({ success: false, message: err.message });
    }
    setLaunchingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Health Outreach & Broadcast Campaigns</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Anti-Ban Shield Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated screening drives, vaccination reminders, and patient wellness alerts with humanized safe-pacing
          </p>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          notification.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {notification.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((c) => {
          const liveStatus = activeStatuses.find(s => s.campaignId === c.campaign_id);
          const isRunning = liveStatus?.status === 'RUNNING' || c.status === 'RUNNING';

          return (
            <div key={c.campaign_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                    <p className="text-xs text-teal-700 font-mono mt-0.5">{c.type} • {c.target_audience}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isRunning 
                      ? 'bg-blue-100 text-blue-800 animate-pulse' 
                      : c.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isRunning ? 'DISPATCHING (SAFE)' : c.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                  {c.template_text || c.message_template}
                </div>

                {liveStatus && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600">
                      <span>Dispatch Progress: {liveStatus.sentCount} / {liveStatus.totalRecipients} sent</span>
                      <span className="font-semibold text-teal-700">
                        {Math.round((liveStatus.sentCount / (liveStatus.totalRecipients || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${(liveStatus.sentCount / (liveStatus.totalRecipients || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                <div className="space-y-0.5">
                  <div>Recipients: <strong className="text-slate-800">{c.total_recipients || 150}</strong></div>
                  <div className="text-[10px] text-teal-700 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" /> 4-7s human jitter pacing
                  </div>
                </div>

                <button
                  onClick={() => handleLaunch(c.campaign_id)}
                  disabled={launchingId === c.campaign_id || isRunning}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {launchingId === c.campaign_id || isRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {isRunning ? 'Sending...' : 'Launch Campaign'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
