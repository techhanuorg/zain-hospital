"use client";

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Layers,
  Activity,
  Gauge,
  Sliders,
  Flame,
  Clock,
  Cpu,
  ArrowDownCircle,
  ArrowUpCircle,
  KeyRound,
  Copy,
  Check,
  Hash
} from 'lucide-react';

export default function WhatsAppConnectPage() {
  const [session, setSession] = useState<any>({
    status: 'DISCONNECTED',
    connectedNumber: null,
    connectedSince: null,
    instanceName: 'Jain-CareOS-WhatsApp',
    batteryLevel: 0,
    isPlugged: true,
    qrDataUrl: null,
    qrCode: null,
    antiBan: {
      queueLength: { high: 0, medium: 0, low: 0, total: 0 },
      sentInCurrentHour: 0,
      hourlyLimit: 400,
      sentToday: 0,
      dailyLimit: 3500,
      totalSent: 0,
      totalFailed: 0,
      safetyStatus: 'OPTIMAL',
      config: {
        minDelayMs: 3500,
        maxDelayMs: 7000,
        batchSize: 15,
        batchCooldownMs: 25000,
        simulateTyping: true,
        spintaxVariation: true,
        dailyLimit: 3500,
        hourlyLimit: 400
      }
    },
    inboundQueue: {
      queuedCount: 0,
      activeWorkers: 0,
      maxWorkers: 60,
      totalIngested: 0,
      totalProcessed: 0,
      totalDropped: 0,
      fastPathReplies: 0,
      avgProcessingTimeMs: 0,
      peakQueueDepth: 0,
      currentThroughputPerSec: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+91');
  const [testMessage, setTestMessage] = useState('Namaste! CareOS WhatsApp AI Reception system test message.');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [burstCount, setBurstCount] = useState(1000);
  const [bursting, setBursting] = useState(false);

  const [configDraft, setConfigDraft] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Phone Number / Pairing Code State
  const [connectMethod, setConnectMethod] = useState<'qr' | 'pairing'>('qr');
  const [pairPhone, setPairPhone] = useState('+91');
  const [pairLoading, setPairLoading] = useState(false);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [pairCopied, setPairCopied] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/whatsapp/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        if (data.pairingCode && !pairCode) {
          setPairCode(data.pairingCode);
        }
        if (!configDraft && data.antiBan?.config) {
          setConfigDraft(data.antiBan.config);
        }
      }
    } catch (e) {
      console.error('Failed to fetch session:', e);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string, extraData: any = {}) => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData })
      });
      const data = await res.json();
      if (data.status) {
        setSession((prev: any) => ({ ...prev, status: data.status }));
      }
      fetchSession();
    } catch (e) {
      console.error('Action failed:', e);
    }
    setLoading(false);
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pairPhone.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 10) {
      setPairError('Please enter a valid phone number with country code (e.g. +91 98110 54321)');
      return;
    }
    setPairLoading(true);
    setPairError(null);
    setPairCode(null);
    try {
      const res = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_pairing_code', phone: pairPhone })
      });
      const data = await res.json();
      if (res.ok && data.pairingCode) {
        setPairCode(data.pairingCode);
      } else {
        setPairError(data.error || 'Failed to generate pairing code');
      }
      fetchSession();
    } catch (err: any) {
      setPairError(err.message || 'Network error occurred');
    }
    setPairLoading(false);
  };

  const handleCopyPairCode = () => {
    if (!pairCode) return;
    navigator.clipboard.writeText(pairCode.replace('-', ''));
    setPairCopied(true);
    setTimeout(() => setPairCopied(false), 2000);
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
        setTestResult({ success: true, message: `Message dispatched safely with typing simulation! (ID: ${data.messageId})` });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send message' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error' });
    }
    setTestSending(false);
  };

  const handleSimulateBurst = async () => {
    setBursting(true);
    try {
      const res = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_burst', burstCount })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
      }
      fetchSession();
    } catch (e) {}
    setBursting(false);
  };

  const handleSaveConfig = async () => {
    if (!configDraft) return;
    setSavingConfig(true);
    try {
      await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_antiban_config', config: configDraft })
      });
      fetchSession();
    } catch (e) {}
    setSavingConfig(false);
  };

  const antiBan = session.antiBan || {};
  const inbound = session.inboundQueue || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Main Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">CareOS High-Concurrency & Anti-Ban WhatsApp Hub</h1>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              1 Lakh+ Bursts Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise multi-device engine equipped with 60 parallel async workers, token-bucket pacing, human presence typing, and ban protection.
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

      {/* 4 High-Level Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Anti-Ban Shield */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Anti-Ban Protection</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{antiBan.safetyStatus || 'OPTIMAL'}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">Active Shield</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Pacing: {antiBan.config?.minDelayMs / 1000}s - {antiBan.config?.maxDelayMs / 1000}s + Jitter
          </p>
        </div>

        {/* Card 2: Inbound Ingestion */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Inbound Queue</span>
            <ArrowDownCircle className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{inbound.queuedCount || 0}</span>
            <span className="text-[10px] text-slate-500">in buffer</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Total Ingested: <strong className="text-slate-800 font-mono">{inbound.totalIngested || 0}</strong>
          </p>
        </div>

        {/* Card 3: Worker Concurrency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Worker Pool</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {inbound.activeWorkers || 0} / {inbound.maxWorkers || 60}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold">Parallel Threads</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Avg Latency: <strong className="text-slate-800 font-mono">{inbound.avgProcessingTimeMs || 0}ms</strong>
          </p>
        </div>

        {/* Card 4: Daily Safe Quota */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Daily Safe Volume</span>
            <Gauge className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{antiBan.sentToday || 0}</span>
            <span className="text-[10px] text-slate-500">/ {antiBan.dailyLimit || 3500}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-purple-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, ((antiBan.sentToday || 0) / (antiBan.dailyLimit || 3500)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: QR Code & Anti-Ban Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connection Mode Card (QR Code vs Phone Pairing Code) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Hospital Official WhatsApp Line</h2>
                <p className="text-xs text-slate-500">Connect via WhatsApp QR Scan or 8-Digit Phone Pairing Code</p>
              </div>
              <div className="flex items-center gap-2">
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
                      title="Clear credentials to scan or pair brand new number"
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
                    Reconnect
                  </button>
                )}
              </div>
            </div>

            {/* Connection Method Tabs (Only when not connected) */}
            {session.status !== 'CONNECTED' && (
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setConnectMethod('qr')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                    connectMethod === 'qr'
                      ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Method 1: Scan QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setConnectMethod('pairing')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                    connectMethod === 'pairing'
                      ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  Method 2: Link with Phone Number (Pairing Code)
                </button>
              </div>
            )}

            {/* TAB 1: QR CODE METHOD */}
            {connectMethod === 'qr' && (
              <div className="flex flex-col md:flex-row items-center gap-8 py-2">
                {/* Visual QR Code Display */}
                <div className="w-64 h-64 bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-lg flex-shrink-0">
                  {session.status === 'CONNECTED' ? (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </div>
                      <span className="text-sm font-bold text-emerald-300">WhatsApp Active!</span>
                      <span className="text-xs text-white font-mono mt-1 font-semibold">
                        {session.connectedNumber || 'Jain Hospital Reception'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-2">
                        Listening on port & ready for 1 Lakh+ message bursts
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

                {/* Instructions */}
                <div className="space-y-3 flex-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-teal-600" />
                      Quick Scan Steps:
                    </h3>
                    <button
                      onClick={() => handleAction('refresh_qr')}
                      disabled={loading}
                      className="text-[11px] text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh QR
                    </button>
                  </div>
                  <ol className="space-y-2 list-decimal list-inside leading-relaxed text-slate-700 font-medium">
                    <li>Open WhatsApp on the reception mobile device.</li>
                    <li>Go to <span className="font-semibold text-slate-900">Settings</span> (iOS) or <span className="font-semibold text-slate-900">Menu ⋮</span> (Android) ➔ <span className="font-semibold text-teal-700">Linked Devices</span>.</li>
                    <li>Tap <span className="font-semibold text-slate-900">Link a Device</span>.</li>
                    <li>Scan the QR code on this screen.</li>
                  </ol>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-start gap-2 mt-4">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Anti-Ban Engine Armed:</strong> Your number is protected by dynamic token pacing, natural typing simulation, and message spintax variators.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PHONE NUMBER PAIRING CODE METHOD */}
            {connectMethod === 'pairing' && (
              <div className="space-y-6 py-2">
                {session.status === 'CONNECTED' ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-sm text-emerald-950">WhatsApp Connected Successfully</h3>
                    <p className="text-xs font-mono font-bold text-emerald-800">{session.connectedNumber}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left: Input Form & Code Display */}
                    <div className="md:col-span-6 space-y-4">
                      <form onSubmit={handleRequestPairingCode} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-800">
                          Enter Reception WhatsApp Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={pairPhone}
                            onChange={(e) => setPairPhone(e.target.value)}
                            placeholder="+919811054321"
                            className="w-full text-xs font-mono px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                            required
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Include international country code (e.g. +91 for India) without spaces or hyphens.
                        </p>

                        <button
                          type="submit"
                          disabled={pairLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                        >
                          {pairLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                          {pairLoading ? 'Generating WhatsApp Code...' : 'Get 8-Digit Pairing Code'}
                        </button>
                      </form>

                      {pairError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>{pairError}</span>
                        </div>
                      )}

                      {/* Display 8-Digit Pairing Code */}
                      {pairCode && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center space-y-3 shadow-md">
                          <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
                            Your WhatsApp Pairing Code
                          </span>
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-2xl font-extrabold tracking-widest text-white bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 select-all">
                              {pairCode}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyPairCode}
                              className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
                              title="Copy Pairing Code"
                            >
                              {pairCopied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Code expires in 2 minutes. Enter this code inside WhatsApp on your mobile phone.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Step-by-Step Mobile Pairing Guide */}
                    <div className="md:col-span-6 bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-600">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-teal-600" />
                        How to enter code on your Phone:
                      </h3>
                      <ol className="space-y-2.5 list-decimal list-inside leading-relaxed text-slate-700 font-medium">
                        <li>Open <span className="font-bold text-slate-900">WhatsApp</span> on your mobile device.</li>
                        <li>Go to <span className="font-semibold text-slate-900">Settings</span> (iPhone) or <span className="font-semibold text-slate-900">Menu ⋮</span> (Android) ➔ <span className="font-semibold text-teal-700">Linked Devices</span>.</li>
                        <li>Tap <span className="font-semibold text-slate-900">Link a Device</span>.</li>
                        <li>At the bottom of the QR scanner camera, tap <span className="font-bold text-teal-700 bg-teal-50 px-1 py-0.5 rounded">&quot;Link with phone number instead&quot;</span>.</li>
                        <li>Type the <strong className="text-slate-900 font-mono">8-digit code</strong> shown on your screen.</li>
                      </ol>

                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-[11px] flex items-start gap-2 mt-4">
                        <Zap className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Zero Camera Required:</strong> Perfect for desktop-to-mobile pairing or when scanning via camera is blurry or inconvenient.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Anti-Ban & Pacing Controls Panel */}
          {configDraft && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <h2 className="font-bold text-sm text-slate-900">Anti-Ban Pacing & Humanization Engine</h2>
                </div>
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  {savingConfig ? 'Saving...' : 'Apply Protection Settings'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Min Message Delay: {configDraft.minDelayMs / 1000}s
                  </label>
                  <input
                    type="range"
                    min="1500"
                    max="8000"
                    step="500"
                    value={configDraft.minDelayMs}
                    onChange={(e) => setConfigDraft({ ...configDraft, minDelayMs: Number(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Base interval between outbound dispatches</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Max Delay with Jitter: {configDraft.maxDelayMs / 1000}s
                  </label>
                  <input
                    type="range"
                    min="3000"
                    max="15000"
                    step="500"
                    value={configDraft.maxDelayMs}
                    onChange={(e) => setConfigDraft({ ...configDraft, maxDelayMs: Number(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Randomized upper limit simulating human typing variability</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batch Rest Cooldown: {configDraft.batchCooldownMs / 1000}s after every {configDraft.batchSize} msgs
                  </label>
                  <input
                    type="range"
                    min="10000"
                    max="60000"
                    step="5000"
                    value={configDraft.batchCooldownMs}
                    onChange={(e) => setConfigDraft({ ...configDraft, batchCooldownMs: Number(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Daily Safety Cap: {configDraft.dailyLimit} messages/day
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={configDraft.dailyLimit}
                    onChange={(e) => setConfigDraft({ ...configDraft, dailyLimit: Number(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={configDraft.simulateTyping}
                    onChange={(e) => setConfigDraft({ ...configDraft, simulateTyping: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Simulate Real Typing Presence (composing status)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={configDraft.spintaxVariation}
                    onChange={(e) => setConfigDraft({ ...configDraft, spintaxVariation: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Dynamic Spintax & Hash Variation (Anti-fingerprint)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Col 3: Stress Testing & Dispatch Simulator */}
        <div className="space-y-6">
          {/* High Traffic Stress Tester */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-sm text-slate-900">1 Lakh+ Concurrency Tester</h2>
            </div>
            <p className="text-xs text-slate-500">
              Fire rapid synthetic message bursts into the queue to stress-test parallel worker throughput.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Burst Message Volume
                </label>
                <select
                  value={burstCount}
                  onChange={(e) => setBurstCount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={100}>100 Messages (Micro Burst)</option>
                  <option value={1000}>1,000 Messages (Standard OPD Peak)</option>
                  <option value={5000}>5,000 Messages (Heavy Traffic)</option>
                  <option value={20000}>20,000 Messages (Extreme Spike)</option>
                  <option value={100000}>100,000 Messages (1 Lakh Full Scale)</option>
                </select>
              </div>

              <button
                onClick={handleSimulateBurst}
                disabled={bursting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {bursting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Fire {burstCount.toLocaleString()} Inbound Messages
              </button>
            </div>
          </div>

          {/* Single Live WhatsApp Test Dispatch */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h2 className="font-bold text-sm text-slate-900">Live WhatsApp Tester</h2>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone (with Country Code)
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Text
                </label>
                <textarea
                  rows={2}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={testSending || session.status !== 'CONNECTED'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send with Human Pacing
              </button>
            </form>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                <span className="break-all">{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
