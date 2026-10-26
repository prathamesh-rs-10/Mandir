import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function ReportPage({ onNavigate }) {
  const [config, setConfig] = useState(null);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      const [configRes, phasesRes] = await Promise.all([
        supabase.from('mandir_reports_config').select('*').limit(1).single(),
        supabase
          .from('mandir_progress_reports')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
      ]);

      if (configRes.data) {
        setConfig(configRes.data);
      }

      if (phasesRes.data) {
        setPhases(phasesRes.data);
      }

      setLoading(false);
    }

    fetchReportData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
      </div>
    );
  }

  // Calculate overall metrics from backend data
  const totalPhases = phases.length;
  const completedPhases = phases.filter((p) => p.status === 'पूर्ण' || p.completion_pct === 100).length;
  const inProgressPhases = phases.filter(
    (p) => (p.status === 'प्रगतीपथावर' || (p.completion_pct > 0 && p.completion_pct < 100))
  ).length;
  
  const overallPct = totalPhases > 0
    ? Math.round(phases.reduce((sum, p) => sum + (Number(p.completion_pct) || 0), 0) / totalPhases)
    : 0;

  const getStatusBadge = (status) => {
    if (status === 'पूर्ण') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (status === 'प्रगतीपथावर') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-stone-100 text-stone-700 border-stone-200';
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Dynamic Header */}
        {(config?.page_title || config?.page_subtitle) && (
          <div className="text-center space-y-3">
            {config.page_title && (
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                {config.page_title}
              </h1>
            )}
            {config.page_subtitle && (
              <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto">
                {config.page_subtitle}
              </p>
            )}
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-amber-500 mx-auto rounded-full mt-3" />
          </div>
        )}

        {/* Dynamic Overview & Audit Note */}
        {(config?.overview_note || config?.last_inspected_date || config?.supervisor_committee) && (
          <div className="bg-white border border-amber-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
            {config.overview_note && (
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base whitespace-pre-line text-justify sm:text-left">
                {config.overview_note}
              </p>
            )}
            {(config.last_inspected_date || config.supervisor_committee) && (
              <div className="pt-3 border-t border-amber-100 flex flex-wrap items-center justify-between text-xs sm:text-sm text-stone-500 gap-2">
                {config.last_inspected_date && (
                  <div>
                    <span className="font-semibold text-stone-700">अंतिम पाहणी तारीख:</span> {config.last_inspected_date}
                  </div>
                )}
                {config.supervisor_committee && (
                  <div>
                    <span className="font-semibold text-stone-700">तपासणी समिती:</span> {config.supervisor_committee}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Overall Progress Dashboard Cards */}
        {totalPhases > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold text-orange-600">
                {overallPct}%
              </span>
              <span className="text-xs sm:text-sm text-stone-600 font-medium mt-1 block">
                एकंदर बांधकाम प्रगती
              </span>
            </div>
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold text-stone-900">
                {totalPhases}
              </span>
              <span className="text-xs sm:text-sm text-stone-600 font-medium mt-1 block">
                एकूण नियोजित टप्पे
              </span>
            </div>
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {completedPhases}
              </span>
              <span className="text-xs sm:text-sm text-stone-600 font-medium mt-1 block">
                पूर्ण झालेले टप्पे
              </span>
            </div>
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold text-amber-600">
                {inProgressPhases}
              </span>
              <span className="text-xs sm:text-sm text-stone-600 font-medium mt-1 block">
                प्रगतीपथावरील टप्पे
              </span>
            </div>
          </div>
        )}

        {/* Detailed Phases List */}
        <div className="space-y-6">
          {phases.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-sm transition hover:shadow-md space-y-5"
            >
              {/* Header row: Phase Number, Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {p.phase_number && (
                      <span className="text-xs font-bold text-orange-800 bg-orange-100 border border-orange-200 px-2.5 py-0.5 rounded">
                        {p.phase_number}
                      </span>
                    )}
                    {p.status && (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    )}
                  </div>
                  {p.phase_title && (
                    <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                      {p.phase_title}
                    </h3>
                  )}
                </div>

                <div className="text-right sm:shrink-0">
                  <span className="text-2xl font-black text-orange-600">
                    {p.completion_pct ?? 0}%
                  </span>
                  <span className="block text-[11px] text-stone-500 font-medium uppercase tracking-wider">
                    पूर्ण
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200/60">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(Number(p.completion_pct) || 0, 0), 100)}%` }}
                />
              </div>

              {/* Site Progress Photo (if attached) */}
              {p.image_url && (
                <div className="rounded-xl overflow-hidden border border-stone-200 max-h-72">
                  <img
                    src={p.image_url}
                    alt={p.phase_title || 'बांधकाम प्रगती'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Description */}
              {p.description && (
                <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {p.description}
                </p>
              )}

              {/* Work Highlights */}
              {p.key_highlights && (
                <div className="bg-amber-50/60 border-l-4 border-amber-500 p-3 rounded-r-lg text-xs sm:text-sm text-stone-800">
                  <span className="font-bold text-amber-900">सध्याचे काम / ठळक प्रगती:</span> {p.key_highlights}
                </div>
              )}

              {/* Meta Grid: Dates, Costs, Supervisor */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100 text-xs sm:text-sm">
                {p.start_date && (
                  <div>
                    <span className="text-stone-400 block text-[11px]">सुरूवात:</span>
                    <span className="font-semibold text-stone-800">{p.start_date}</span>
                  </div>
                )}
                {p.target_date && (
                  <div>
                    <span className="text-stone-400 block text-[11px]">अपेक्षित पूर्णता:</span>
                    <span className="font-semibold text-stone-800">{p.target_date}</span>
                  </div>
                )}
                {p.estimated_cost && (
                  <div>
                    <span className="text-stone-400 block text-[11px]">अंदाजित खर्च:</span>
                    <span className="font-semibold text-stone-800">{p.estimated_cost}</span>
                  </div>
                )}
                {p.spent_cost && (
                  <div>
                    <span className="text-stone-400 block text-[11px]">झालेला खर्च:</span>
                    <span className="font-semibold text-stone-800">{p.spent_cost}</span>
                  </div>
                )}
              </div>

              {/* Supervisor / Engineer Note */}
              {p.supervisor_note && (
                <div className="text-xs text-stone-500 italic bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  अभियंता / समिती शेरा: {p.supervisor_note}
                </div>
              )}
            </div>
          ))}

          {phases.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-stone-400 border border-stone-200">
              सध्या कोणतेही बांधकाम टप्पे उपलब्ध नाहीत.
            </div>
          )}
        </div>

        {/* CTA section back to donations */}
        {onNavigate && (
          <div className="text-center pt-6">
            <button
              onClick={() => onNavigate('donations')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition transform hover:-translate-y-0.5"
            >
              या पावन कार्यात देणगी अर्पण करा
            </button>
          </div>
        )}
      </div>
    </div>
  );
}