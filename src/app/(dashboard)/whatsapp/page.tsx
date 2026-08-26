"use client";

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  RefreshCw, 
  PowerOff, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Info 
} from 'lucide-react';

export default function WhatsAppConnectPage() {
  const [session, setSession] = useState<any>({
    status: 'CONNECTED',
    connectedNumber: '+91 98110 54321',
    connectedSince: '2026-08-26T08:00:00Z',
    instanceName: 'Apex-Hospital-Main',
    batteryLevel: 98,
    isPlugged: true
  });
  const [loading, setLoading] = useState(false);

  const fetchSession = () => {
    fetch('/api/whatsapp/session')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      setSession((prev: any) => ({ ...prev, status: data.status || prev.status }));
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">WhatsApp Web & Evolution API Hub</h1>
          <p className="text-xs text-slate-500 mt-1">Manage active WhatsApp numbers, QR authentication, and real-time webhook status</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            session.status === 'CONNECTED' 
              ? 'bg-emerald-100 text-emerald-800' 
              : session.status === 'QR_REQUIRED'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              session.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}></span>
            {session.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Code / Connection Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Hospital Official WhatsApp</h2>
              <p className="text-xs text-slate-500">Scan via WhatsApp Linked Devices to re-authenticate</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('refresh_qr')}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh QR
              </button>
              {session.status === 'CONNECTED' ? (
                <button
                  onClick={() => handleAction('disconnect')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleAction('reconnect')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Connect
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 py-4">
            {/* Visual QR Code Display */}
            <div className="w-56 h-56 bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-inner">
              <div className="w-48 h-48 bg-white rounded-xl p-3 flex flex-col items-center justify-center">
                <QrCode className="w-36 h-36 text-slate-900" />
                <span className="text-[10px] text-slate-500 font-mono mt-1">Apex_Live_Token_2026</span>
              </div>
              {session.status === 'CONNECTED' && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-emerald-300">Session Authenticated</span>
                  <span className="text-[10px] text-slate-300 font-mono mt-0.5">{session.connectedNumber}</span>
                </div>
              )}
            </div>

            {/* Instruction Steps */}
            <div className="space-y-3 flex-1 text-xs text-slate-600">
              <h3 className="font-bold text-slate-900 text-sm">How to Connect:</h3>
              <ol className="space-y-2 list-decimal list-inside leading-relaxed text-slate-700 font-medium">
                <li>Open WhatsApp on the hospital reception phone.</li>
                <li>Tap <span className="font-semibold text-slate-900">Settings</span> or <span className="font-semibold text-slate-900">Menu</span> and select <span className="font-semibold text-teal-700">Linked Devices</span>.</li>
                <li>Tap <span className="font-semibold text-slate-900">Link a Device</span>.</li>
                <li>Point your camera at this QR code screen to sync.</li>
              </ol>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-[11px] flex items-start gap-2 mt-4">
                <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>Multi-device session keeps your AI reception online 24/7 even when phone is disconnected from WiFi.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Session Metadata */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            Session Telemetry
          </h2>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Instance Name</span>
              <span className="font-semibold font-mono text-slate-800">{session.instanceName}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Active Phone</span>
              <span className="font-bold text-slate-900">{session.connectedNumber}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Battery Level</span>
              <span className="font-semibold text-emerald-700">{session.batteryLevel}% (Charging)</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Connected Since</span>
              <span className="font-medium text-slate-700">{new Date(session.connectedSince).toLocaleDateString()}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Security Layer</span>
              <span className="font-semibold text-teal-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> AES-256 E2EE
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-1">Webhook Endpoint:</div>
            <div className="bg-slate-900 text-teal-400 font-mono text-[10px] p-2 rounded-lg break-all">
              /api/whatsapp/webhook
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
