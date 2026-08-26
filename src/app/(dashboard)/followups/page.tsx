"use client";

import React, { useState, useEffect } from 'react';
import { HeartPulse, Plus, Clock, CheckCircle2 } from 'lucide-react';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/followups')
      .then(res => res.json())
      .then(data => setFollowups(data.followups || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Care & Follow-Up Automation</h1>
          <p className="text-xs text-slate-500 mt-0.5">Medicine course countdowns, post-consultation check-ins, and missed appointment recovery</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Follow-Up ID</th>
              <th className="py-3 px-4">Category & Title</th>
              <th className="py-3 px-4">Scheduled Date</th>
              <th className="py-3 px-4">Message Template</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {followups.map((f) => (
              <tr key={f.followup_id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{f.followup_id}</td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{f.title}</div>
                  <div className="text-[10px] text-teal-600 font-mono">{f.type}</div>
                </td>
                <td className="py-3 px-4 font-semibold">{f.scheduled_date} {f.scheduled_time}</td>
                <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{f.message_template}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    f.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                    f.status === 'RESPONDED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
