"use client";

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Activity, 
  Cpu, 
  Bell, 
  Languages, 
  CheckCircle2 
} from 'lucide-react';

export default function Header() {
  const [keyStats, setKeyStats] = useState({ healthy: 11, total: 11 });

  useEffect(() => {
    fetch('/api/ai/groq-keys')
      .then(res => res.json())
      .then(data => {
        if (data.healthy_count !== undefined) {
          setKeyStats({ healthy: data.healthy_count, total: data.total_keys });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
      {/* Active Hospital */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Jain Hospital & Research Centre</h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Node
            </span>
          </div>
          <p className="text-xs text-slate-500">Basheerganj, Bahraich (U.P.) • Emergency 24x7</p>
        </div>
      </div>

      {/* Badges & Live Health */}
      <div className="flex items-center gap-3">
        {/* Multilingual Badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg">
          <Languages className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-medium">12 Indian Languages</span>
        </div>

        {/* 11-Key Failover Pool Status */}
        <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-900 text-xs px-2.5 py-1.5 rounded-lg font-medium">
          <Cpu className="w-3.5 h-3.5 text-teal-600" />
          <span>Groq Key Pool:</span>
          <span className="font-bold text-teal-700">{keyStats.healthy}/{keyStats.total} Healthy</span>
        </div>

        {/* WhatsApp Connection */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-2.5 py-1.5 rounded-lg font-medium">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp:</span>
          <span className="font-bold text-emerald-700">+91 98110 54321</span>
        </div>
      </div>
    </header>
  );
}
