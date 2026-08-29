"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  CalendarCheck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  HeartPulse, 
  Stethoscope, 
  Bot, 
  QrCode, 
  ArrowUpRight,
  TrendingUp,
  MessageSquareCode
} from 'lucide-react';

export default function OverviewDashboard() {
  const [metrics, setMetrics] = useState<any>({
    totalPatients: 148,
    todayAppointments: 24,
    confirmedAppointments: 18,
    completedAppointments: 4,
    cancelledAppointments: 1,
    noShowAppointments: 1,
    noShowRatePercent: 4,
    dueFollowups: 8,
    activeDoctors: 12,
    aiResolutionRatePercent: 94.2
  });

  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch(() => {});

    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        if (data.appointments) setAppointments(data.appointments.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-teal-800/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-500/30 mb-2 inline-block">
            AI Reception Desk Online
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Zain Hospital Bahraich — WhatsApp Command Center</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Autonomous multi-lingual WhatsApp reception handling appointments, Hindi/Hinglish NLP, messy input normalization, real-time slots, and medicine follow-up reminders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/simulator"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md"
          >
            <MessageSquareCode className="w-4 h-4" />
            Launch WhatsApp Simulator
          </Link>
          <Link
            href="/whatsapp"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2.5 rounded-xl font-medium text-xs transition-all"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            WhatsApp Session
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Today Appointments</span>
            <CalendarCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.todayAppointments}</div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" /> +18% from last week
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>AI Resolution Rate</span>
            <Bot className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.aiResolutionRatePercent}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Autonomous bookings & queries</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Follow-ups Due</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.dueFollowups}</div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">Meds & Post-Op recovery</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>No-Show Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.noShowRatePercent}%</div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">Automated re-engagement active</div>
        </div>
      </div>

      {/* Appointment Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-800">Confirmed</div>
            <div className="text-xl font-bold text-emerald-900">{metrics.confirmedAppointments}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600 opacity-80" />
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-800">Completed</div>
            <div className="text-xl font-bold text-blue-900">{metrics.completedAppointments}</div>
          </div>
          <Clock className="w-6 h-6 text-blue-600 opacity-80" />
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-800">Cancelled</div>
            <div className="text-xl font-bold text-rose-900">{metrics.cancelledAppointments}</div>
          </div>
          <XCircle className="w-6 h-6 text-rose-600 opacity-80" />
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-800">No-Show</div>
            <div className="text-xl font-bold text-amber-900">{metrics.noShowAppointments}</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-600 opacity-80" />
        </div>
      </div>

      {/* Main Grid: Recent Appointments & 5 AI Agents Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Live WhatsApp Bookings</h3>
              <p className="text-xs text-slate-500">Real-time incoming appointments booked by AI</p>
            </div>
            <Link href="/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Doctor & Dept</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {appointments.length > 0 ? (
                  appointments.map((app) => (
                    <tr key={app.appointment_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{app.patient_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{app.whatsapp_number}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div>{app.doctor_name}</div>
                        <div className="text-[10px] text-teal-600">{app.department_name}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold">{app.appointment_date}</div>
                        <div className="text-[11px] text-slate-500">{app.appointment_time}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          WhatsApp AI
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          app.status === 'CONFIRMED'
                            ? 'bg-teal-100 text-teal-800'
                            : app.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">Loading appointments...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5 AI Agents Status Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">5 Primary AI Agents</h3>
            <p className="text-xs text-slate-500">Autonomous role-based agent orchestra</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Agent 1: Front Desk Agent
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Hospital info, OPD timings, directions, 24x7 emergency</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Active</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Agent 2: Appointment Agent
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Slots engine, booking, double-booking lock, reschedules</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Active</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Agent 3: Patient Care Agent
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Medicine course countdown, post-op recovery, missed visit alerts</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Active</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Agent 4: Patient Record Agent
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Patient identification, registration, visit history, consent</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Active</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Agent 5: Admin & Ops Agent
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Doctor utilization, no-show summaries, daily statistics</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
