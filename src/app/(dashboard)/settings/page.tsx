"use client";

import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Multi-Tenant Hospital & AI Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure tenant rules, WhatsApp session defaults, and role-based permissions</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-slate-900">AI Model & Temperature</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-500 block mb-1 font-medium">Primary LLM Model</label>
              <input
                type="text"
                defaultValue="llama-3.3-70b-versatile"
                className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1 font-medium">Temperature</label>
              <input
                type="number"
                defaultValue={0.2}
                step={0.05}
                className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="font-bold text-sm text-slate-900">WhatsApp Automation Guardrails</h2>
          <div className="space-y-2 text-slate-700 font-medium">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded text-teal-600" />
              <span>Enable automatic 24-hour and 2-hour appointment reminder jobs</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded text-teal-600" />
              <span>Enable Day-9 medicine course completion follow-ups</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded text-teal-600" />
              <span>Enable automated no-show recovery workflows</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
