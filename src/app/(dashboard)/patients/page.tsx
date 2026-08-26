"use client";

import React, { useState, useEffect } from 'react';
import { UserRound, Phone, ShieldCheck, Calendar } from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => setPatients(data.patients || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Patient Directory & EMR</h1>
        <p className="text-xs text-slate-500 mt-0.5">Verified WhatsApp identities, consent records, and medical visit timeline</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Patient ID</th>
              <th className="py-3 px-4">Name & Demographics</th>
              <th className="py-3 px-4">WhatsApp Phone</th>
              <th className="py-3 px-4">Language</th>
              <th className="py-3 px-4">Consent Status</th>
              <th className="py-3 px-4">Registered Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {patients.map((p) => (
              <tr key={p.patient_id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.patient_id}</td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.age} yrs • {p.gender}</div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-800">{p.whatsapp_number}</td>
                <td className="py-3 px-4 uppercase font-mono text-teal-700">{p.preferred_language}</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                    <ShieldCheck className="w-3 h-3" /> Opted In
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">{new Date(p.registration_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
