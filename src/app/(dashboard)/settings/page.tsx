"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  CheckCircle2, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  Loader2, 
  AlertCircle, 
  Smartphone,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheetName = payload.sheetName || "Appointments";
    var data = payload.data || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = Object.keys(data);
      headers.push("synced_at");
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e6f4ea");
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var key = headers[i];
      if (key === "synced_at") {
        row.push(new Date().toLocaleString());
      } else {
        row.push(data[key] !== undefined ? data[key] : "");
      }
    }

    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const [sheetsConfig, setSheetsConfig] = useState<any>({
    isConfigured: false,
    fullWebhookUrl: '',
    spreadsheetId: '',
    autoSync: true,
    totalSyncedCount: 0,
    lastSyncTime: null,
    lastSyncStatus: 'IDLE'
  });
  const [webhookInput, setWebhookInput] = useState('');
  const [testingSync, setTestingSync] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [savingSheets, setSavingSheets] = useState(false);

  const fetchSheetsConfig = async () => {
    try {
      const res = await fetch('/api/settings/google-sheets');
      if (res.ok) {
        const data = await res.json();
        setSheetsConfig(data);
        if (data.fullWebhookUrl) {
          setWebhookInput(data.fullWebhookUrl);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSheetsConfig();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveSheets = async () => {
    setSavingSheets(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          webhookUrl: webhookInput,
          autoSync: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        fetchSheetsConfig();
      }
    } catch (e) {}
    setSavingSheets(false);
  };

  const handleTestSync = async () => {
    setTestingSync(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_ping',
          webhookUrl: webhookInput
        })
      });
      const data = await res.json();
      setTestResult(data);
      fetchSheetsConfig();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    }
    setTestingSync(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospital System & Storage Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Phone-Friendly Google Sheets Sync, WhatsApp AI parameters, and automation guardrails
          </p>
        </div>
      </div>

      {/* PHONE-FRIENDLY GOOGLE SHEETS INTEGRATION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900">Phone-Friendly Google Sheets Real-Time Sync</h2>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> 100% Mobile Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Zero Cloud Console setup required. Syncs appointments & patient bookings directly into your personal Google Sheet!
              </p>
            </div>
          </div>

          <span className={`self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
            sheetsConfig.isConfigured 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${sheetsConfig.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {sheetsConfig.isConfigured ? 'Sync Connected' : 'Setup Required'}
          </span>
        </div>

        {/* Input Webhook URL */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Your Google Apps Script Web App URL:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleSaveSheets}
              disabled={savingSheets || !webhookInput}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {savingSheets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save URL
            </button>
            <button
              onClick={handleTestSync}
              disabled={testingSync || !webhookInput}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {testingSync ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Test Sync
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* 2-Minute Mobile Setup Guide */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Phone Se Setup Karne Ka 2-Minute Guide (Hindi/English):
            </h3>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold text-[11px] transition active:scale-95 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copied ? 'Copied Code!' : 'Copy Script Code'}
            </button>
          </div>

          <ol className="space-y-1.5 list-decimal list-inside leading-relaxed text-slate-600 font-medium">
            <li>Apne phone browser mein <strong className="text-slate-900">sheets.new</strong> open karke ek nayi Google Sheet banayein.</li>
            <li>Sheet ke andar <strong className="text-slate-900">Extensions ➔ Apps Script</strong> par click karein (ya <strong className="text-slate-900">script.google.com</strong> kholein).</li>
            <li>Upar diye gaye <strong className="text-teal-700">&quot;Copy Script Code&quot;</strong> button ko dabayein aur script editor mein paste kar dein.</li>
            <li>Top-right mein <strong className="text-slate-900">Deploy ➔ New Deployment</strong> click karein:
              <ul className="list-disc list-inside ml-4 text-[11px] text-slate-500 mt-0.5">
                <li>Select type: <strong className="text-slate-700">Web App</strong></li>
                <li>Who has access: <strong className="text-emerald-700">Anyone</strong> (zaroori hai taaki server row bhej sake)</li>
              </ul>
            </li>
            <li>Milne wala <strong className="text-slate-900">Web App URL</strong> copy karke yahan upar box mein paste karein aur <strong className="text-teal-700">&quot;Test Sync&quot;</strong> dabayein!</li>
          </ol>
        </div>

        {/* Live Sync Stats */}
        {sheetsConfig.isConfigured && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Total Rows Synced</span>
              <strong className="text-slate-900 text-sm font-mono">{sheetsConfig.totalSyncedCount || 0}</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Auto-Sync Status</span>
              <strong className="text-emerald-700 font-semibold">Real-Time (Active)</strong>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[11px]">Last Sync</span>
              <strong className="text-slate-800 text-[11px]">
                {sheetsConfig.lastSyncTime ? new Date(sheetsConfig.lastSyncTime).toLocaleTimeString() : 'Never'}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* AI & Automation Guardrails */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 text-xs">
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-slate-900">AI Model & Temperature</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-teal-600" />
              <span>Enable automatic 24-hour and 2-hour appointment reminder jobs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-teal-600" />
              <span>Enable Day-9 medicine course completion follow-ups</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-teal-600" />
              <span>Enable automated no-show recovery workflows</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
