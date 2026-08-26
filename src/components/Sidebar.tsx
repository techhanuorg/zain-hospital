"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  QrCode, 
  MessageSquareCode, 
  MessagesSquare, 
  CalendarCheck2, 
  UserRound, 
  Stethoscope, 
  HeartPulse, 
  Megaphone, 
  BookOpenText, 
  Cpu, 
  ShieldCheck, 
  Sliders,
  Hospital
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Executive Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'WhatsApp Connect', href: '/whatsapp', icon: QrCode, badge: 'Active' },
  { name: 'WhatsApp Simulator', href: '/simulator', icon: MessageSquareCode, highlight: true },
  { name: 'Live Conversations', href: '/conversations', icon: MessagesSquare },
  { name: 'Appointments & Slots', href: '/appointments', icon: CalendarCheck2 },
  { name: 'Doctors & Schedules', href: '/doctors', icon: Stethoscope },
  { name: 'Patients & EMR', href: '/patients', icon: UserRound },
  { name: 'Patient Care & Followup', href: '/followups', icon: HeartPulse },
  { name: 'Outreach Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Hospital Knowledge', href: '/knowledge-base', icon: BookOpenText },
  { name: 'Groq 11-Key Pool', href: '/groq-pool', icon: Cpu, badge: '11 Keys' },
  { name: 'Audit & Health', href: '/audit', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Sliders },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40">
        <div className="h-10 w-10 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
          <Hospital className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Care<span className="text-teal-400">OS</span>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-1.5 py-0.5 rounded border border-teal-500/30">AI</span>
          </h1>
          <p className="text-[11px] text-slate-400">Hospital WhatsApp OS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white font-semibold shadow-sm'
                  : item.highlight
                  ? 'bg-teal-950/60 text-teal-300 hover:bg-teal-900/60 border border-teal-800/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-teal-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Hospital Identity Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 font-medium">Tenant ID:</span>
          <span className="font-mono text-teal-400 text-[10px]">hosp_apex_01</span>
        </div>
        <div className="text-slate-300 font-semibold truncate">Apex Super Speciality</div>
        <div className="text-slate-500 text-[10px] flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>WhatsApp Live & Connected</span>
        </div>
      </div>
    </aside>
  );
}
