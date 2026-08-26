"use client";

import React, { useState, useEffect } from 'react';
import { Stethoscope, Clock, Calendar, IndianRupee } from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/doctors')
      .then(res => res.json())
      .then(data => setDoctors(data.doctors || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Doctor Roster & OPD Schedules</h1>
        <p className="text-xs text-slate-500 mt-0.5">Specialist profiles, working hours, break times, and slot durations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((d) => (
          <div key={d.doctor_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{d.doctor_name}</h3>
                <p className="text-xs text-teal-700 font-medium">{d.specialization}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{d.qualification}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>OPD: {d.start_time} - {d.end_time} (Break: {d.break_start}-{d.break_end})</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Days: {d.working_days.join(', ')}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                <span>Fee: ₹{d.consultation_fee} • Slot: {d.slot_duration_minutes} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
