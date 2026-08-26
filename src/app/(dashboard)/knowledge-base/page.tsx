"use client";

import React, { useState, useEffect } from 'react';
import { BookOpenText, Phone, MapPin, Clock, ShieldCheck, HeartPulse } from 'lucide-react';

export default function KnowledgeBasePage() {
  const [hospital, setHospital] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setHospital(data.hospital))
      .catch(() => {});
  }, []);

  if (!hospital) return <div className="text-xs text-slate-400">Loading knowledge base...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Hospital Knowledge Base & OPD Schedules</h1>
        <p className="text-xs text-slate-500 mt-0.5">Verified hospital facts used by Front Desk Agent 1. AI never hallucinates information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <h2 className="font-bold text-sm text-slate-900">General Information</h2>
          <div className="space-y-2 text-slate-700">
            <p><strong>Hospital:</strong> {hospital.name}</p>
            <p><strong>Address:</strong> {hospital.address}, {hospital.city}, {hospital.state} - {hospital.pincode}</p>
            <p><strong>OPD Timings:</strong> {hospital.opd_timings}</p>
            <p><strong>Visiting Hours:</strong> {hospital.visiting_hours}</p>
            <p><strong>Emergency:</strong> {hospital.emergency_phone} (24x7 Helpline)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <h2 className="font-bold text-sm text-slate-900">Supported Cashless Insurance TPAs</h2>
          <div className="flex flex-wrap gap-1.5">
            {hospital.insurance_supported?.map((ins: string, idx: number) => (
              <span key={idx} className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg font-medium">
                {ins}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
