"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Printer, LogOut, LayoutDashboard, Calendar, Settings, Database, Users 
} from 'lucide-react';
import { DAYS, SEMESTERS } from './constants';

// --- TYPES ---
type Course = {
  id: string;
  subject: string;
  subjectLabel: string;
  type: string;
  teacher: string;
  room: string;
};

export default function App() {
  const [semester, setSemester] = useState('S1');
  const [activeGroup, setActiveGroup] = useState('Groupe 1');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('planning');
  const [assignmentRows, setAssignmentRows] = useState<Course[]>([]);
  const [schedule, setSchedule] = useState<Record<string, any>>({});

  // Chargement des données locales
  useEffect(() => {
    const savedRows = localStorage.getItem('supnum_assignment_rows');
    const savedSchedule = localStorage.getItem('supnum_schedule');
    if (savedRows) setAssignmentRows(JSON.parse(savedRows));
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
  }, []);

  const getCellContent = (day: string, slotIndex: number) => {
    const key = `${semester}|w${currentWeek}|${activeGroup}|${day}|${slotIndex}`;
    const ids = schedule[key];
    const courseIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);
    return courseIds.map(id => assignmentRows.find(r => r.id === id)).filter(Boolean) as Course[];
  };

  return (
    <div className="flex h-screen bg-slate-50" style={{ fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR - COULEUR VERT SUPNUM (#c4d79b) FORCÉE */}
      <aside 
        className="no-print w-64 flex flex-col shadow-inner border-r border-slate-300" 
        style={{ backgroundColor: '#c4d79b', minHeight: '100vh' }}
      >
        <div className="p-6 text-center border-b border-black/10">
          <img src="/supnum.png" alt="Logo SupNum" className="h-12 mx-auto mb-2" />
          <p className="text-[10px] font-black uppercase text-slate-800">Menu Principal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'planning', label: 'Planning', icon: Calendar },
            { id: 'manage', label: 'Gestion Cours', icon: LayoutDashboard },
            { id: 'data', label: 'Données', icon: Database },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'config', label: 'Paramètres', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all"
              style={{
                backgroundColor: activeTab === item.id ? 'rgba(255,255,255,0.4)' : 'transparent',
                color: '#1e293b',
                borderRight: activeTab === item.id ? '4px solid #334155' : 'none'
              }}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-black/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-700 font-bold text-sm hover:bg-white/20 rounded-lg">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER - HARMONISÉ EN VERT */}
        <header className="no-print flex items-center justify-between px-8 py-2 border-b" style={{ backgroundColor: '#c4d79b' }}>
          <div className="flex items-center gap-4">
            <img src="/rim.png" alt="RIM" className="h-10" />
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase">Institut Supérieur du Numérique</h1>
              <p className="text-[10px] font-bold text-slate-700">Emploi du Temps Officiel</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-xs flex items-center gap-2 shadow-lg">
            <Printer size={16} /> IMPRIMER
          </button>
        </header>

        {/* GRILLE DE PLANNING */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="bg-white shadow-2xl border border-slate-300 mx-auto max-w-7xl">
            <div className="grid grid-cols-[80px_repeat(5,1fr)] w-full border-t border-l border-slate-900">
              {/* Header Jours */}
              <div className="bg-slate-200 border-r border-b border-slate-900 p-2 flex items-center justify-center font-black text-[10px]">Heure</div>
              {DAYS.map(day => (
                <div key={day} className="bg-slate-200 border-r border-b border-slate-900 p-3 text-center font-black uppercase text-xs text-slate-900">
                  {day}
                </div>
              ))}

              {/* Créneaux et Cartes */}
              {['08:00', '09:45', '11:30', '14:00', '15:45'].map((slot, idx) => (
                <React.Fragment key={slot}>
                  <div className="bg-slate-50 border-r border-b border-slate-900 p-2 flex items-center justify-center text-[9px] font-black text-slate-500">
                    {slot}
                  </div>
                  {DAYS.map(day => {
                    const courses = getCellContent(day, idx);
                    return (
                      <div key={`${day}-${idx}`} className="border-r border-b border-slate-900 min-h-[120px] p-1.5 bg-white">
                        {courses.map((c) => (
                          <div 
                            key={c.id} 
                            className="relative p-2 mb-2 rounded shadow-sm border border-slate-200 bg-white"
                            style={{ 
                              borderLeft: c.type.startsWith('CM') ? '5px solid #f59e0b' : '5px solid #2563eb' 
                            }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-slate-100">
                                {c.type}
                              </span>
                              <span className="text-[9px] font-bold text-slate-300">#{c.subject}</span>
                            </div>
                            <div className="font-black text-[10px] text-slate-900 uppercase leading-tight mb-2">
                              {c.subjectLabel}
                            </div>
                            <div className="flex flex-col gap-1 border-t border-slate-50 pt-1">
                              <div className="flex items-center gap-1 text-red-600">
                                <User size={10} />
                                <span className="text-[9px] font-bold italic truncate uppercase">{c.teacher}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-900">
                                <MapPin size={10} className="text-blue-500" />
                                <span className="text-[10px] font-black uppercase">{c.room}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}