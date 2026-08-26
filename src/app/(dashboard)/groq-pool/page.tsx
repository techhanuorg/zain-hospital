"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Zap, Activity } from 'lucide-react';

export default function GroqPoolPage() {
  const [poolData, setPoolData] = useState<any>({ keys: [], healthy_count: 11, total_keys: 11 });

  useEffect(() => {
    fetch('/api/ai/groq-keys')
      .then(res => res.json())
      .then(data => setPoolData(data))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Groq 11-Key Failover & Health Pool</h1>
          <p className="text-xs text-slate-500 mt-0.5">Round-robin load balancer, automatic 429 rate-limit cooldown, and latency telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            {poolData.healthy_count}/{poolData.total_keys} Keys Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {poolData.keys?.map((k: any) => (
          <div key={k.key_index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-slate-900">Key #{k.key_index + 1}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                k.status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {k.status}
              </span>
            </div>
            <div className="font-mono text-slate-500 text-[11px]">{k.key_hint}</div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-100 text-[11px]">
              <div>Requests: <strong className="text-slate-800">{k.request_count}</strong></div>
              <div>Latency: <strong className="text-teal-700">{k.avg_latency_ms} ms</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
