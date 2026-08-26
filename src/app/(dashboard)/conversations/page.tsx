"use client";

import React, { useState, useEffect } from 'react';
import { 
  MessagesSquare, 
  Search, 
  UserRound, 
  Bot, 
  UserCheck, 
  Send, 
  AlertCircle, 
  Clock 
} from 'lucide-react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetch('/api/analytics')
      .then(() => {
        setConversations([
          {
            conversation_id: 'conv_ramesh_01',
            whatsapp_number: '+919876543210',
            patient_name: 'Ramesh Singh',
            last_message_text: 'Appointment Confirmed ✅ Dr Rahul Sharma, 27 Aug 6:00 PM',
            last_message_time: '12:30 PM',
            status: 'ACTIVE',
            active_agent: 'APPOINTMENT',
            detected_language: 'hinglish'
          },
          {
            conversation_id: 'conv_sunita_02',
            whatsapp_number: '+919811122233',
            patient_name: 'Sunita Devi',
            last_message_text: 'दवाई कब तक लेनी है?',
            last_message_time: '11:15 AM',
            status: 'HUMAN_ASSIGNED',
            active_agent: 'FRONT_DESK',
            detected_language: 'hi'
          }
        ]);
        setSelectedConv({
          conversation_id: 'conv_ramesh_01',
          whatsapp_number: '+919876543210',
          patient_name: 'Ramesh Singh',
          status: 'ACTIVE',
          active_agent: 'APPOINTMENT',
          messages: [
            { sender: 'PATIENT', text: 'mujhe doctor ko dikhana hai kal shaam ko', time: '12:20 PM' },
            { sender: 'AI', text: 'Namaste Ramesh ji! 😊 Aap kis department me appointment lena chahte hain?\n\n1️⃣ Cardiology (दिल)\n2️⃣ Orthopaedics (हड्डी)', time: '12:20 PM' },
            { sender: 'PATIENT', text: 'cardiology dr sharma', time: '12:21 PM' },
            { sender: 'AI', text: 'Dr. Rahul Sharma ke kal shaam ke available slots: 5:30 PM, 6:00 PM, 6:30 PM', time: '12:21 PM' },
            { sender: 'PATIENT', text: '6', time: '12:22 PM' },
            { sender: 'AI', text: 'Appointment Confirmed ✅ Dr Rahul Sharma, 27 Aug 6:00 PM (ID: APP-98421)', time: '12:22 PM' }
          ]
        });
      });
  }, []);

  const handleSendStaffReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: selectedConv.whatsapp_number,
        text: replyText,
        conversationId: selectedConv.conversation_id
      })
    });
    setSelectedConv((prev: any) => ({
      ...prev,
      messages: [...prev.messages, { sender: 'STAFF', text: replyText, time: 'Just now' }]
    }));
    setReplyText('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Live WhatsApp Conversations & Human Handoff</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitor AI chat threads, take over for human escalation, and reply directly as hospital staff</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[640px]">
        {/* Left List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name or number..."
                className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.map((c) => (
              <div
                key={c.conversation_id}
                onClick={() => setSelectedConv({
                  ...c,
                  messages: [
                    { sender: 'PATIENT', text: c.last_message_text, time: c.last_message_time }
                  ]
                })}
                className={`p-3.5 cursor-pointer hover:bg-slate-50 transition ${
                  selectedConv?.conversation_id === c.conversation_id ? 'bg-teal-50/70 border-l-4 border-teal-600' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-semibold text-xs text-slate-900">{c.patient_name || c.whatsapp_number}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{c.last_message_time}</div>
                </div>
                <div className="text-xs text-slate-500 truncate mb-1.5">{c.last_message_text}</div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    c.status === 'HUMAN_ASSIGNED' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                  }`}>
                    {c.status === 'HUMAN_ASSIGNED' ? '🔴 Human Attention Required' : '🤖 AI Managed'}
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-mono">{c.detected_language}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Timeline */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              {/* Timeline Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                    <UserRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{selectedConv.patient_name || 'Patient'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{selectedConv.whatsapp_number}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConv((prev: any) => ({ ...prev, status: prev.status === 'HUMAN_ASSIGNED' ? 'ACTIVE' : 'HUMAN_ASSIGNED' }))}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                    selectedConv.status === 'HUMAN_ASSIGNED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {selectedConv.status === 'HUMAN_ASSIGNED' ? 'Hand back to AI' : 'Take Over (Human Staff)'}
                </button>
              </div>

              {/* Chat Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] whatsapp-bg">
                {selectedConv.messages?.map((m: any, idx: number) => (
                  <div key={idx} className={`flex flex-col ${m.sender === 'PATIENT' ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs shadow-sm whitespace-pre-wrap ${
                      m.sender === 'PATIENT' ? 'bg-white text-slate-900' : m.sender === 'STAFF' ? 'bg-blue-100 text-slate-900' : 'bg-[#d9fdd3] text-slate-900'
                    }`}>
                      {m.text}
                      <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Staff Reply Box */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendStaffReply()}
                  placeholder="Type reply as Hospital Staff..."
                  className="flex-1 border border-slate-200 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  onClick={handleSendStaffReply}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a conversation to view chat timeline
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
