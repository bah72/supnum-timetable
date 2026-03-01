"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import {
  LayoutDashboard, Calendar, Settings, X, AlertTriangle, Search, Trash2, 
  Split, Users, Filter, MapPin, Plus, Minus, Database, Download, Upload, 
  Save, LogOut, Printer, Copy, ChevronLeft, ChevronRight
} from 'lucide-react';

// Types et Constantes (Importés de vos fichiers existants)
import { AssignmentRow, CourseType, User } from './types';
import { MASTER_DB, ALL_ROOMS, MAIN_GROUPS, DAYS, SEMESTERS } from './constants';
import { secureAuthenticate, SecureUser } from './lib/auth-secure';

// --- HELPERS SERVICES ---
const AssignmentRowService = {
  getTeacherStats: (assignmentRows: AssignmentRow[], schedule: Record<string, string | null | string[]>, semesterFilter?: string) => {
    const stats: Record<string, { cm: number, td: number, tp: number, total: string }> = {};
    Object.values(schedule).forEach(courseValue => {
      if (!courseValue) return;
      const courseIds = Array.isArray(courseValue) ? courseValue : [courseValue];
      courseIds.forEach(courseId => {
        const row = assignmentRows.find(r => r.id === courseId);
        if (!row || (semesterFilter && row.semester !== semesterFilter)) return;
        const teacher = row.teacher || 'Non assigné';
        if (!stats[teacher]) stats[teacher] = { cm: 0, td: 0, tp: 0, total: '0' };
        if (row.type === 'CM') stats[teacher].cm++;
        else if (row.type.startsWith('TD')) stats[teacher].td++;
        else if (row.type.startsWith('TP')) stats[teacher].tp++;
      });
    });
    Object.values(stats).forEach(stat => {
      const eqCm = stat.cm + ((stat.td + stat.tp) * 2 / 3);
      stat.total = eqCm.toFixed(1);
    });
    return stats;
  }
};

// --- COMPOSANTS DE CELLULE ---
const TimeSlotCell = ({ id, courses, onRemove }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`border-r border-b border-slate-300 min-h-[120px] p-1 transition-colors relative
        ${isOver ? 'bg-blue-50' : 'bg-white'} print:min-h-[140px]`}
    >
      {courses.map((course: AssignmentRow) => (
        <div 
          key={course.id}
          className={`course-card mb-1 p-1.5 rounded border text-[10px] leading-tight shadow-sm group
            ${course.type === 'CM' ? 'bg-orange-100 border-orange-300 text-orange-900' : 
              course.type.startsWith('TD') ? 'bg-blue-100 border-blue-300 text-blue-900' : 
              'bg-green-100 border-green-300 text-green-900'}`}
        >
          <div className="flex justify-between font-bold border-b border-black/5 mb-1">
            <span className="uppercase">{course.type} - {course.subject}</span>
            <button onClick={() => onRemove(course.id)} className="no-print opacity-0 group-hover:opacity-100 text-red-600">
              <X size={10} />
            </button>
          </div>
          <div className="truncate font-medium">{course.subjectLabel}</div>
          <div className="flex justify-between mt-1 pt-1 border-t border-black/5 italic">
            <span>{course.teacher}</span>
            <span className="font-bold">{course.room}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<SecureUser | null>(null);
  const [semester, setSemester] = useState('S1');
  const [group, setGroup] = useState('Groupe 1');
  const [week, setWeek] = useState(1);
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([]);
  const [schedule, setSchedule] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('planning');

  // Load data
  useEffect(() => {
    const savedRows = localStorage.getItem('supnum_assignment_rows');
    const savedSchedule = localStorage.getItem('supnum_schedule');
    if (savedRows) setAssignmentRows(JSON.parse(savedRows));
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
  }, []);

  const handlePrint = () => { window.print(); };

  // Filtrage des cours disponibles (Sidebar)
  const availableCourses = useMemo(() => {
    const scheduledIds = new Set(Object.values(schedule).flat());
    return assignmentRows.filter(r => 
      r.semester === semester && 
      r.mainGroup === group && 
      !scheduledIds.has(r.id) &&
      (r.subject.toLowerCase().includes(searchQuery.toLowerCase()) || r.teacher.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [assignmentRows, semester, group, schedule, searchQuery]);

  const removeCourse = (courseId: string) => {
    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach(key => {
      newSchedule[key] = (newSchedule[key] || []).filter(id => id !== courseId);
    });
    setSchedule(newSchedule);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans overflow-hidden">
      
      {/* HEADER BANNER - MASQUÉ AU PRINT */}
      <header className="no-print flex flex-col shrink-0 bg-white shadow-sm z-50">
        <div className="flex items-center justify-between px-6 py-2 bg-[#c4d79b]">
          <img src="/rim.png" alt="RIM" className="h-10" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Institut Supérieur du Numérique</h1>
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-700">Emploi du temps</h2>
          </div>
          <img src="/supnum.png" alt="SupNum" className="h-10" />
        </div>

        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-50 border-b gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Semestre</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} className="font-bold text-blue-700 outline-none text-sm bg-transparent">
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col border-l pl-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Groupe</label>
              <select value={group} onChange={(e) => setGroup(e.target.value)} className="font-bold text-blue-700 outline-none text-sm bg-transparent">
                {MAIN_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex flex-col border-l pl-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Semaine</label>
              <select value={week} onChange={(e) => setWeek(parseInt(e.target.value))} className="font-bold text-blue-700 outline-none text-sm bg-transparent">
                {Array.from({length: 20}, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Chercher un cours..." 
                className="pl-8 pr-4 py-1.5 rounded-full border border-slate-300 text-xs w-48 focus:w-64 transition-all outline-none focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all">
              <Printer size={16} /> Imprimer
            </button>
            <button onClick={() => {}} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg shadow-sm">
              <Save size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR COURS DISPONIBLES - MASQUÉE AU PRINT */}
        <aside className="no-print w-72 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Calendar size={16} /> À programmer
            </h3>
            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {availableCourses.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {availableCourses.map(course => (
              <div key={course.id} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm hover:border-blue-400 cursor-grab active:scale-95 transition-all">
                <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{course.type} • {course.subject}</div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-1">{course.subjectLabel}</div>
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                  <span className="italic">{course.teacher}</span>
                  <span className="font-bold bg-slate-100 px-1 rounded">{course.room}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ZONE DU PLANNING */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 print:p-0 print:bg-white">
          
          {/* CONTENEUR D'EXPORTATION (ID utilisé pour le print) */}
          <div id="export-container" className="mx-auto bg-white shadow-lg rounded-xl overflow-hidden min-w-[1100px] print:min-w-full print:shadow-none print:rounded-none">
            
            {/* HEADER SPÉCIFIQUE IMPRESSION (Invisible à l'écran) */}
            <div className="hidden print:flex items-center justify-between p-6 border-b-4 border-slate-800 mb-4">
              <div className="flex items-center gap-6">
                <img src="/rim.png" alt="" className="h-16" />
                <div>
                  <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">Institut Supérieur du Numérique</h1>
                  <p className="text-lg font-bold text-blue-700">Emploi du Temps : Semestre {semester} - {group}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xl font-black mb-1">
                  S{week}
                </div>
                <p className="text-xs font-bold text-slate-500">Année Universitaire 2025/2026</p>
              </div>
            </div>

            {/* GRILLE DU PLANNING */}
            <div className="grid grid-cols-[100px_repeat(5,1fr)] print:grid-cols-[80px_repeat(5,1fr)]">
              
              {/* Jours de la semaine */}
              <div className="bg-slate-800 text-white border-r border-slate-700 p-4 flex items-center justify-center font-bold uppercase text-xs">
                Heure
              </div>
              {DAYS.map(day => (
                <div key={day} className="bg-slate-800 text-white border-r border-slate-700 p-4 text-center font-black uppercase text-sm tracking-widest">
                  {day}
                </div>
              ))}

              {/* Créneaux Horaires */}
              {['08:00-09:30', '09:45-11:15', '11:30-13:00', '14:00-15:30', '15:45-17:15'].map((slot, rowIndex) => (
                <React.Fragment key={slot}>
                  {/* Colonne Temps */}
                  <div className="bg-slate-50 border-r border-b border-slate-300 flex items-center justify-center p-2">
                    <span className="text-[11px] font-black text-slate-600 text-center leading-tight whitespace-pre-line">
                      {slot.replace('-', '\n-\n')}
                    </span>
                  </div>
                  
                  {/* Cellules de Cours */}
                  {DAYS.map((day) => {
                    const cellId = `${day}-${rowIndex}`;
                    const coursesInCell = (schedule[cellId] || [])
                      .map(id => assignmentRows.find(r => r.id === id))
                      .filter(Boolean);

                    return (
                      <TimeSlotCell 
                        key={cellId} 
                        id={cellId} 
                        courses={coursesInCell}
                        onRemove={removeCourse}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* PIED DE PAGE IMPRESSION (Visible uniquement sur papier) */}
            <div className="hidden print:block p-6 mt-4 border-t border-slate-200">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 italic">Document officiel généré par le système de gestion ISN - {new Date().toLocaleDateString()}</p>
                  <div className="flex gap-4 text-[10px] font-bold uppercase">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-200 border border-orange-400"></div> CM</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-200 border border-blue-400"></div> TD</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-200 border border-green-400"></div> TP</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold mb-12 uppercase text-slate-700">Signature de la Direction</p>
                  <div className="w-48 h-1 border-b-2 border-slate-400 border-dashed mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER STATS RAPIDE (Optionnel) */}
      <footer className="no-print bg-white border-t p-2 px-6 text-[10px] flex justify-between text-slate-500 font-medium">
        <div>Utilisateur : {currentUser?.name || 'Administrateur'}</div>
        <div className="flex gap-4">
          <span>{assignmentRows.length} cours configurés</span>
          <span>{Object.values(schedule).flat().length} séances programmées</span>
        </div>
      </footer>
    </div>
  );
}