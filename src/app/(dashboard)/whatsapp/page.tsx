"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  RefreshCw, 
  PowerOff, 
  LogOut, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Info,
  Send,
  Loader2,
  AlertCircle,
  PhoneCall,
  Sparkles
} from 'lucide-react';

export default function WhatsAppConnectPage() {
  const [session, setSession] = useState<any>({
    status: 'DISCONNECTED',
    connectedNumber: null,
    connectedSince: null,
    instanceName: 'Apex-CareOS-WhatsApp',
    batteryLevel: 0,
    isPlugged: true,
    qrDataUrl: null,
    qrCode: null
  });
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+91');
  const [testMessage, setTestMessage] = useState('Namaste! CareOS WhatsApp AI Reception system test message.');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/whatsapp/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (e) {
      console.error('Failed to fetch session:', e);
    }
  };

  useEffect(() => {
    fetchSession();

    // Auto-poll every 3s when waiting for QR or connecting
    const interval = setInterval(() => {
      fetchSession();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string) => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.status) {
        setSession((prev: any) => ({ 
          ...prev, 
          status: data.status,
          qrDataUrl: data.qrDataUrl || prev.qrDataUrl,
          qrCode: data.qrCode || prev.qrCode
        }));
      }
      fetchSession();
    } catch (e) {
      console.error('Action failed:', e);
    }
    setLoading(false);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;

    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_test',
          phone: testPhone,
          message: testMessage
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: `Message sent successfully! (ID: ${data.messageId})` });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send message' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error' });
    }
    setTestSending(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Baileys WhatsApp Web Engine</h1>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Native Multi-Device
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scan QR code with your hospital WhatsApp phone to activate 24/7 AI Reception, slot booking & automated follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            session.status === 'CONNECTED' 
              ? 'bg-emerald-100 text-emerald-800' 
              : session.status === 'QR_REQUIRED'
              ? 'bg-amber-100 text-amber-800'
              : session.status === 'CONNECTING'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              session.status === 'CONNECTED' 
                ? 'bg-emerald-500 animate-pulse' 
                : session.status === 'QR_REQUIRED' || session.status === 'CONNECTING'
                ? 'bg-amber-500 animate-ping'
                : 'bg-rose-500'
            }`}></span>
            {session.status === 'QR_REQUIRED' ? 'Scan QR Code' : session.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Code / Connection Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Hospital Official WhatsApp Line</h2>
              <p className="text-xs text-slate-500">Linked Device authentication via @whiskeysockets/baileys</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('refresh_qr')}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {session.status === 'CONNECTED' ? 'Re-generate QR' : 'Refresh / Get QR'}
              </button>

              {session.status === 'CONNECTED' ? (
                <>
                  <button
                    onClick={() => handleAction('disconnect')}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition active:scale-95"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                  <button
                    onClick={() => handleAction('logout')}
                    disabled={loading}
                    title="Clear device session and generate brand new QR"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleAction('reconnect')}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Connect
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 py-2">
            {/* Visual QR Code Display */}
            <div className="w-64 h-64 bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-lg">
              {session.status === 'CONNECTED' ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold text-emerald-300">WhatsApp Connected!</span>
                  <span className="text-xs text-white font-mono mt-1 font-semibold">
                    {session.connectedNumber || 'Apex Hospital Reception'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-2">
                    AI Auto-Responder is active and listening for patient messages.
                  </span>
                </div>
              ) : session.qrDataUrl ? (
                <div className="w-56 h-56 bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={session.qrDataUrl} 
                    alt="Scan WhatsApp QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : session.status === 'CONNECTING' ? (
                <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                  <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
                  <span className="text-xs font-medium">Initializing Baileys Socket...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-3 text-center p-4">
                  <QrCode className="w-16 h-16 text-slate-600" />
                  <p className="text-xs text-slate-400">Click &quot;Refresh / Get QR&quot; to generate your WhatsApp login code</p>
                  <button
                    onClick={() => handleAction('refresh_qr')}
                    disabled={loading}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow transition"
                  >
                    Start & Scan QR
                  </button>
                </div>
              )}
            </div>

            {/* Instruction Steps */}
            <div className="space-y-3 flex-1 text-xs text-slate-600">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-600" />
                How to Connect your Hospital WhatsApp:
              </h3>
              <ol className="space-y-2 list-decimal list-inside leading-relaxed text-slate-700 font-medium">
                <li>Open WhatsApp on the hospital reception mobile phone.</li>
                <li>Tap <span className="font-semibold text-slate-900">Settings</span> (iOS) or <span className="font-semibold text-slate-900">Menu ⋮</span> (Android) and select <span className="font-semibold text-teal-700">Linked Devices</span>.</li>
                <li>Tap <span className="font-semibold text-slate-900">Link a Device</span>.</li>
                <li>Point your phone camera to scan this QR code screen.</li>
              </ol>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-[11px] flex items-start gap-2 mt-4">
                <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>
                  Baileys multi-device protocol operates independently. Once scanned, your CareOS AI reception stays online 24/7.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Session Metadata */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            Live Session Telemetry
          </h2>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Engine Type</span>
              <span className="font-semibold text-teal-700 font-mono">@whiskeysockets/baileys</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Instance ID</span>
              <span className="font-semibold font-mono text-slate-800">{session.instanceName || 'Apex-CareOS-WhatsApp'}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Active Phone</span>
              <span className="font-bold text-slate-900">
                {session.connectedNumber || (session.status === 'CONNECTED' ? 'Active' : 'Not Connected')}
              </span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Connection State</span>
              <span className="font-semibold text-slate-800">{session.status}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Connected Since</span>
              <span className="font-medium text-slate-700">
                {session.connectedSince ? new Date(session.connectedSince).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-500">Security Layer</span>
              <span className="font-semibold text-teal-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Signal E2EE KeyStore
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-1">Live Webhook / Inbound Stream:</div>
            <div className="bg-slate-900 text-teal-400 font-mono text-[10px] p-2 rounded-lg break-all">
              messages.upsert → AI Orchestrator (Auto)
            </div>
          </div>
        </div>
      </div>

      {/* Interactive WhatsApp Message Tester */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h2 className="font-bold text-sm text-slate-900">Test Live WhatsApp Dispatch</h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Send an instant test message to any patient/staff mobile number
          </span>
        </div>

        <form onSubmit={handleSendTestMessage} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient Phone Number (with Country Code)
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Test Message Text
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter message..."
                className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <button
                type="submit"
                disabled={testSending || session.status !== 'CONNECTED'}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Send
              </button>
            </div>
          </div>
        </form>

        {testResult && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
