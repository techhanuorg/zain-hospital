"use client";

import React, { useState } from 'react';
import { 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Bot, 
  User, 
  Sparkles, 
  Languages, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  HelpCircle,
  Stethoscope,
  RotateCcw
} from 'lucide-react';

interface ChatBubble {
  id: string;
  sender: 'PATIENT' | 'AI';
  text: string;
  timestamp: string;
  language?: string;
  intent?: string;
  agent?: string;
  toolCalls?: any[];
  entities?: any;
}

const PRESET_TEST_CASES = [
  { label: 'Booking in Hinglish', text: 'mujhe doctor ko dikhana hai kal shaam ko' },
  { label: 'Messy input / Typos', text: 'docter sarma cardiologis appointmnt' },
  { label: 'Hindi Devanagari', text: 'नमस्ते, कल सुबह डॉक्टर शर्मा से मिलना है, नाम रमेश उम्र 42' },
  { label: 'Any-format extraction', text: 'mera naam ramesh age 42 male hai aur kal cardiologist ko dikhana hai' },
  { label: 'Short 1-word reply (Low Literacy)', text: 'haan' },
  { label: 'Medicine followup', text: 'medicine kal khatam ho jayegi' },
  { label: 'Hospital Timings & OPD', text: 'hospital kitne baje khulta hai' },
  { label: 'Emergency', text: 'emergency hai ambulance chahiye' },
  { label: 'Human handoff', text: 'reception staff se baat karni hai' },
];

export default function WhatsAppSimulatorPage() {
  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      id: '1',
      sender: 'AI',
      text: 'Namaste! 🙏 Main Zain Hospital Bahraich ka AI digital assistant hoon.\n\nMain aapki appointment booking, doctor timings, ya hospital ki kisi bhi jankari me sahayata kar sakta hoon. Batayein, main aapki kya madad karoon?',
      timestamp: '10:00 AM'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatBubble = {
      id: Date.now().toString(),
      sender: 'PATIENT',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, phone: '+919876543210' })
      });
      const data = await res.json();

      const aiMsg: ChatBubble = {
        id: (Date.now() + 1).toString(),
        sender: 'AI',
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: data.detectedLanguage,
        intent: data.intent,
        agent: data.agent,
        toolCalls: data.toolCallsExecuted,
        entities: data.entities
      };

      setMessages((prev) => [...prev, aiMsg]);
      setActiveAnalysis(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        sender: 'AI',
        text: 'Namaste! 🙏 Main Zain Hospital Bahraich ka AI digital assistant hoon. Main aapki kya sahayata kar sakta hoon?',
        timestamp: '10:00 AM'
      }
    ]);
    setActiveAnalysis(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Interactive WhatsApp AI Simulator</h1>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Test Bench</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Test real Indian patient dialogues in Hindi, Hinglish, messy typos, low-literacy 1-word inputs, and inspect controlled tool execution.</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: WhatsApp Mobile Phone Interface */}
        <div className="lg:col-span-7 flex flex-col h-[650px] bg-[#efeae2] rounded-2xl border border-slate-300 shadow-xl overflow-hidden whatsapp-bg">
          {/* WhatsApp Header */}
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-sm">
                🏥
              </div>
              <div>
                <div className="font-bold text-sm">Zain Hospital Bahraich</div>
                <div className="text-[11px] text-teal-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Verified Hospital Desk (AI Active)
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-teal-800/80 px-2 py-0.5 rounded text-teal-100 font-mono">
                +91 98110 54321
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => {
              const isUser = m.sender === 'PATIENT';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                        : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                    }`}
                  >
                    {m.text}
                    <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                      {m.timestamp}
                    </div>
                  </div>
                  {!isUser && m.agent && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                      <span className="bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-mono">{m.agent}</span>
                      {m.language && <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded uppercase font-mono">{m.language}</span>}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-500 w-fit">
                <Bot className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>AI analyzing intent & checking slots...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="bg-[#f0f2f5] p-3 flex items-center gap-2 border-t border-slate-200 flex-shrink-0">
            <button
              onClick={() => handleSend('Voice note: मुझे कल शाम डॉक्टर राहुल शर्मा से मिलना है')}
              title="Simulate Voice Note"
              className="p-2 text-slate-500 hover:text-teal-700 bg-white rounded-full shadow-sm hover:bg-slate-100 transition"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message in Hindi, Hinglish, or English..."
              className="flex-1 bg-white border-0 text-xs px-4 py-2.5 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-sm disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Reasoning, Entities & Presets */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Preset Test Cases */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2.5">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              One-Click Real Patient Test Scenarios
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TEST_CASES.map((tc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(tc.text)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg transition text-left"
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time AI Telemetry & Entity Extraction */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-teal-600" />
              Real-Time AI Telemetry & Tool Calls
            </h3>

            {activeAnalysis ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Detected Intent</span>
                    <span className="font-bold text-slate-800 font-mono text-[11px]">{activeAnalysis.intent}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Agent Dispatched</span>
                    <span className="font-bold text-teal-700 font-mono text-[11px]">{activeAnalysis.agent}</span>
                  </div>
                </div>

                {/* Extracted Entities with Confidence */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Normalized Entities:</span>
                  <div className="space-y-1 font-mono text-[11px]">
                    {activeAnalysis.entities?.name && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span className="font-semibold text-slate-800">{activeAnalysis.entities.name.value} ({Math.round(activeAnalysis.entities.name.confidence * 100)}%)</span>
                      </div>
                    )}
                    {activeAnalysis.entities?.age && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Age:</span>
                        <span className="font-semibold text-slate-800">{activeAnalysis.entities.age.value} yrs</span>
                      </div>
                    )}
                    {activeAnalysis.entities?.gender && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gender:</span>
                        <span className="font-semibold text-slate-800">{activeAnalysis.entities.gender.value}</span>
                      </div>
                    )}
                    {activeAnalysis.entities?.targetDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-semibold text-teal-700">{activeAnalysis.entities.targetDate.value}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controlled Backend Tools Executed */}
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-teal-400 font-mono block">Controlled Tools Executed:</span>
                  {activeAnalysis.toolCallsExecuted && activeAnalysis.toolCallsExecuted.length > 0 ? (
                    activeAnalysis.toolCallsExecuted.map((tc: any, i: number) => (
                      <div key={i} className="text-[11px] font-mono text-emerald-300">
                        ⚡ {tc.toolName}({JSON.stringify(tc.args)})
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">No DB write required (Direct synthesis)</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Send a message in the simulator to inspect AI reasoning, entity extraction confidence, and controlled tool calls.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
