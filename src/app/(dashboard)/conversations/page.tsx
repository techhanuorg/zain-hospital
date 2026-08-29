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
  Clock,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0) {
          setSelectedConv((prev: any) => {
            if (!prev) return data.conversations[0];
            const updated = data.conversations.find((c: any) => c.conversation_id === prev.conversation_id);
            return updated || data.conversations[0];
          });
        }
      }
    } catch (err) {
      console.error('Failed fetching conversations', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSendStaffReply = async () => {
    if (!replyText.trim() || !selectedConv || isSending) return;
    setIsSending(true);
    const text = replyText.trim();
    setReplyText('');

    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedConv.whatsapp_number,
          message: text,
          conversationId: selectedConv.conversation_id,
          senderType: 'STAFF'
        })
      });

      setSelectedConv((prev: any) => ({
        ...prev,
        last_message_text: text,
        messages: [
          ...(prev.messages || []),
          { sender: 'HUMAN_STAFF', text, time: 'Just now' }
        ]
      }));
      fetchConversations();
    } catch (e) {
      console.error(e);
    }
    setIsSending(false);
  };

  const handleSimulatePatientMessage = async (customText?: string) => {
    const text = customText || prompt('Patient message simulate karein (Hindi/Hinglish):', 'mujhe doctor appointment chahiye kal');
    if (!text || !selectedConv || isSending) return;
    setIsSending(true);

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedConv.whatsapp_number,
          message: text,
          conversationId: selectedConv.conversation_id,
          senderType: 'PATIENT'
        })
      });
      const data = await res.json();

      setSelectedConv((prev: any) => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          { sender: 'PATIENT', text, time: 'Just now' },
          { sender: 'AI_AGENT', text: data.reply || 'Namaste! Main Zain Hospital AI hoon.', time: 'Just now' }
        ]
      }));
      fetchConversations();
    } catch (e) {
      console.error(e);
    }
    setIsSending(false);
  };

  const handleToggleHandoff = async () => {
    if (!selectedConv) return;
    const newStatus = selectedConv.status === 'HUMAN_ASSIGNED' ? 'ACTIVE' : 'HUMAN_ASSIGNED';

    try {
      await fetch(`/api/conversations/${selectedConv.conversation_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      setSelectedConv((prev: any) => ({ ...prev, status: newStatus }));
      fetchConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      (c.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.whatsapp_number || '').includes(searchQuery) ||
      (c.last_message_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterStatus === 'ACTIVE') return c.status === 'ACTIVE';
    if (filterStatus === 'HUMAN_ASSIGNED') return c.status === 'HUMAN_ASSIGNED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-teal-600" />
            Live WhatsApp Conversations — Zain Hospital
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Zain Hospital live AI agent chats, automated instant replies, and human staff takeover desk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Chats
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[660px]">
        {/* Left List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, number, message..."
                className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-1.5 text-[11px]">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${filterStatus === 'ACTIVE' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                🤖 AI Active
              </button>
              <button
                onClick={() => setFilterStatus('HUMAN_ASSIGNED')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${filterStatus === 'HUMAN_ASSIGNED' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                🔴 Staff Attention
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No conversations found</div>
            ) : (
              filteredConversations.map((c) => (
                <div
                  key={c.conversation_id}
                  onClick={() => setSelectedConv(c)}
                  className={`p-3.5 cursor-pointer hover:bg-slate-50 transition ${
                    selectedConv?.conversation_id === c.conversation_id ? 'bg-teal-50/70 border-l-4 border-teal-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold text-xs text-slate-900">{c.patient_name || c.whatsapp_number}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {c.last_message_time ? new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 truncate mb-1.5">{c.last_message_text || 'No messages yet'}</div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      c.status === 'HUMAN_ASSIGNED' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {c.status === 'HUMAN_ASSIGNED' ? '🔴 Human Staff Active' : '🤖 Zain AI Managed'}
                    </span>
                    {c.detected_language && (
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-mono">{c.detected_language}</span>
                    )}
                  </div>
                </div>
              ))
            )}
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
                    <div className="text-[10px] text-slate-500 font-mono">{selectedConv.whatsapp_number}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulatePatientMessage()}
                    title="Simulate new patient message to test AI reply"
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    Test AI Reply
                  </button>
                  <button
                    onClick={handleToggleHandoff}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      selectedConv.status === 'HUMAN_ASSIGNED'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                        : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    {selectedConv.status === 'HUMAN_ASSIGNED' ? 'Hand back to AI' : 'Take Over (Staff)'}
                  </button>
                </div>
              </div>

              {/* Chat Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] whatsapp-bg">
                {selectedConv.messages && selectedConv.messages.length > 0 ? (
                  selectedConv.messages.map((m: any, idx: number) => {
                    const isPatient = m.sender === 'PATIENT';
                    const isStaff = m.sender === 'HUMAN_STAFF' || m.sender === 'STAFF';
                    return (
                      <div key={idx} className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs shadow-sm whitespace-pre-wrap ${
                          isPatient ? 'bg-white text-slate-900 rounded-tl-none' : isStaff ? 'bg-blue-100 text-slate-900 rounded-tr-none border border-blue-200' : 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                        }`}>
                          {!isPatient && (
                            <div className="text-[10px] font-bold text-teal-800 mb-1 flex items-center gap-1">
                              {isStaff ? '👤 Hospital Staff' : '🤖 Zain Care AI'}
                            </div>
                          )}
                          {m.text}
                          <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">{m.time}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-xs text-slate-400">No messages yet in this conversation</div>
                )}
                {isSending && (
                  <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl shadow-sm text-xs text-slate-500 w-fit">
                    <Bot className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>Processing response...</span>
                  </div>
                )}
              </div>

              {/* Staff Reply Box */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendStaffReply()}
                  placeholder="Type reply as Zain Hospital Staff (or press Enter)..."
                  className="flex-1 border border-slate-200 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                />
                <button
                  onClick={handleSendStaffReply}
                  disabled={!replyText.trim() || isSending}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50"
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
