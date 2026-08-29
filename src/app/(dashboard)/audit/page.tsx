"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([
    {
      log_id: 'aud_001',
      action: 'CREATE_APPOINTMENT',
      entity_type: 'APPOINTMENT',
      entity_id: 'APP-98421',
      user_name: 'Zain AI Orchestrator',
      details: { doctor: 'Dr. Rahul Sharma', slot: '2026-08-27 18:00' },
      timestamp: '2026-08-25T14:22:02Z'
    },
    {
      log_id: 'aud_002',
      action: 'EXECUTE_TOOL',
      entity_type: 'TOOL',
      entity_id: 'create_appointment',
      user_name: 'Zain AI Orchestrator',
      details: { slot_locked: true, validation_passed: true },
      timestamp: '2026-08-25T14:22:01Z'
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Security Audit Trail & Controlled Tool Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">Immutable record of all AI actions, database operations, and user role authentications</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Log ID</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Details</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {logs.map((l) => (
              <tr key={l.log_id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{l.log_id}</td>
                <td className="py-3 px-4 font-mono font-semibold text-teal-700">{l.action}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{l.entity_type} ({l.entity_id})</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{l.user_name}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{JSON.stringify(l.details)}</td>
                <td className="py-3 px-4 text-slate-400 font-mono">{new Date(l.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
