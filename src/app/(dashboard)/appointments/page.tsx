"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck2, 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [newForm, setNewForm] = useState({
    patientName: '',
    phone: '+919876543210',
    doctorId: 'doc_sharma_01',
    appointmentDate: '2026-08-27',
    appointmentTime: '18:00',
    notes: ''
  });

  const loadAppointments = () => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => setAppointments(data.appointments || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadAppointments();
    fetch('/api/doctors')
      .then(res => res.json())
      .then(data => setDoctors(data.doctors || []))
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm)
    });
    setShowModal(false);
    loadAppointments();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Appointments & Real-Time Slot Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage doctor appointments, real-time availability, double-booking locks, and cancellations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Appointment ID</th>
                <th className="py-3 px-4">Patient Name & Phone</th>
                <th className="py-3 px-4">Doctor & Department</th>
                <th className="py-3 px-4">Date & Slot Time</th>
                <th className="py-3 px-4">Fee</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {appointments.map((app) => (
                <tr key={app.appointment_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{app.appointment_id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{app.patient_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{app.whatsapp_number}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{app.doctor_name}</div>
                    <div className="text-[10px] text-teal-600">{app.department_name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{app.appointment_date}</div>
                    <div className="text-[11px] text-slate-500">{app.appointment_time}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">₹{app.consultation_fee || 1000}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      app.status === 'CONFIRMED' ? 'bg-teal-100 text-teal-800' :
                      app.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="font-bold text-sm text-slate-900">Book New Appointment</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Patient Name</label>
                <input
                  type="text"
                  value={newForm.patientName}
                  onChange={(e) => setNewForm({ ...newForm, patientName: e.target.value })}
                  placeholder="e.g. Ramesh Singh"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium block mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={newForm.phone}
                  onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium block mb-1">Doctor</label>
                <select
                  value={newForm.doctorId}
                  onChange={(e) => setNewForm({ ...newForm, doctorId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                >
                  {doctors.map(d => (
                    <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name} ({d.specialization})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 font-medium block mb-1">Date</label>
                  <input
                    type="date"
                    value={newForm.appointmentDate}
                    onChange={(e) => setNewForm({ ...newForm, appointmentDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-medium block mb-1">Time (24h)</label>
                  <input
                    type="text"
                    value={newForm.appointmentTime}
                    onChange={(e) => setNewForm({ ...newForm, appointmentTime: e.target.value })}
                    placeholder="18:00"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
