import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const EMPTY_PHASE = {
  phase_number: '',
  phase_title: '',
  description: '',
  completion_pct: 0,
  status: 'प्रलंबित',
  start_date: '',
  target_date: '',
  estimated_cost: '',
  spent_cost: '',
  supervisor_note: '',
  key_highlights: '',
  image_url: '',
  display_order: 1,
  is_active: true,
};

export default function AdminReportsPage({ showNotification }) {
  // Config state
  const [config, setConfig] = useState({
    page_title: '',
    page_subtitle: '',
    overview_note: '',
    last_inspected_date: '',
    supervisor_committee: '',
  });

  // Phases state
  const [phases, setPhases] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [phaseForm, setPhaseForm] = useState(EMPTY_PHASE);

  const [savingConfig, setSavingConfig] = useState(false);
  const [savingPhase, setSavingPhase] = useState(false);
  const [fetching, setFetching] = useState(true);

  const notify = (msg, type = 'success') => {
    if (typeof showNotification === 'function') {
      showNotification(msg, type);
    } else {
      alert(msg);
    }
  };

  const loadData = async () => {
    const [configRes, phasesRes] = await Promise.all([
      supabase.from('mandir_reports_config').select('*').limit(1).single(),
      supabase.from('mandir_progress_reports').select('*').order('display_order', { ascending: true }),
    ]);

    if (configRes.data) {
      setConfig({
        page_title: configRes.data.page_title ?? '',
        page_subtitle: configRes.data.page_subtitle ?? '',
        overview_note: configRes.data.overview_note ?? '',
        last_inspected_date: configRes.data.last_inspected_date ?? '',
        supervisor_committee: configRes.data.supervisor_committee ?? '',
      });
    }

    if (phasesRes.data) {
      setPhases(phasesRes.data);
    }

    setFetching(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Page Header & Committee Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);

    const { error } = await supabase.from('mandir_reports_config').upsert({
      id: 1,
      page_title: config.page_title,
      page_subtitle: config.page_subtitle,
      overview_note: config.overview_note,
      last_inspected_date: config.last_inspected_date,
      supervisor_committee: config.supervisor_committee,
      updated_at: new Date().toISOString(),
    });

    setSavingConfig(false);

    if (!error) {
      notify('प्रगती अहवाल माहिती व समिती तपशील सेव्ह झाले!');
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  // Add or Edit Phase
  const handleSavePhase = async (e) => {
    e.preventDefault();
    setSavingPhase(true);

    const payload = {
      phase_number: phaseForm.phase_number,
      phase_title: phaseForm.phase_title,
      description: phaseForm.description,
      completion_pct: parseInt(phaseForm.completion_pct, 10) || 0,
      status: phaseForm.status,
      start_date: phaseForm.start_date,
      target_date: phaseForm.target_date,
      estimated_cost: phaseForm.estimated_cost,
      spent_cost: phaseForm.spent_cost,
      supervisor_note: phaseForm.supervisor_note,
      key_highlights: phaseForm.key_highlights,
      image_url: phaseForm.image_url || null,
      display_order: parseInt(phaseForm.display_order, 10) || 1,
      is_active: phaseForm.is_active,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (editingId) {
      result = await supabase.from('mandir_progress_reports').update(payload).eq('id', editingId);
    } else {
      result = await supabase.from('mandir_progress_reports').insert([payload]);
    }

    setSavingPhase(false);

    if (!result.error) {
      notify(editingId ? 'टप्पा यशस्वीरित्या अद्ययावत केला!' : 'नवीन टप्पा जोडला!');
      setPhaseForm(EMPTY_PHASE);
      setEditingId(null);
      loadData();
    } else {
      notify('त्रुटी: ' + result.error.message, 'error');
    }
  };

  // Quick inline update for status and percentage
  const handleQuickUpdate = async (id, status, completion_pct) => {
    const { error } = await supabase
      .from('mandir_progress_reports')
      .update({
        status,
        completion_pct: Math.min(Math.max(parseInt(completion_pct, 10) || 0, 0), 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      notify('प्रगती त्वरित अद्यतनित करण्यात आली!');
      loadData();
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  const handleEditClick = (phase) => {
    setEditingId(phase.id);
    setPhaseForm({
      phase_number: phase.phase_number ?? '',
      phase_title: phase.phase_title ?? '',
      description: phase.description ?? '',
      completion_pct: phase.completion_pct ?? 0,
      status: phase.status ?? 'प्रलंबित',
      start_date: phase.start_date ?? '',
      target_date: phase.target_date ?? '',
      estimated_cost: phase.estimated_cost ?? '',
      spent_cost: phase.spent_cost ?? '',
      supervisor_note: phase.supervisor_note ?? '',
      key_highlights: phase.key_highlights ?? '',
      image_url: phase.image_url ?? '',
      display_order: phase.display_order ?? 1,
      is_active: phase.is_active ?? true,
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPhaseForm(EMPTY_PHASE);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('हा टप्पा कायमस्वरूपी हटवायचा आहे का?')) return;
    const { error } = await supabase.from('mandir_progress_reports').delete().eq('id', id);
    if (!error) {
      notify('टप्पा हटवला.');
      loadData();
      if (editingId === id) handleCancelEdit();
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-stone-500 font-medium">डेटा लोड करत आहे...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 font-sans">
      <div className="border-b border-stone-200 pb-3">
        <h2 className="text-xl font-bold text-stone-800">बांधकाम प्रगती अहवाल व्यवस्थापन (Reports CMS)</h2>
        <p className="text-xs text-stone-500 mt-1">
          बांधकाम प्रगती, टप्पे, खर्च आणि समिती अहवाल येथून नियंत्रित करा.
        </p>
      </div>

      {/* 1. Page Header & Committee Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-orange-800 border-b pb-2">
          १. अहवाल पृष्ठ शीर्षक व समिती तपशील (Header & Committee)
        </h3>
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                पृष्ठ मुख्य शीर्षक (Page Title)
              </label>
              <input
                type="text"
                value={config.page_title}
                onChange={(e) => setConfig({ ...config, page_title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                उपशीर्षक (Page Subtitle)
              </label>
              <input
                type="text"
                value={config.page_subtitle}
                onChange={(e) => setConfig({ ...config, page_subtitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                पारदर्शकता व प्रास्ताविक संदेश (Overview Note)
              </label>
              <textarea
                rows="3"
                value={config.overview_note}
                onChange={(e) => setConfig({ ...config, overview_note: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                अंतिम पाहणी तारीख (Last Inspected Date)
              </label>
              <input
                type="text"
                placeholder="उदा. ऑक्टोबर २०२४"
                value={config.last_inspected_date}
                onChange={(e) => setConfig({ ...config, last_inspected_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                तपासणी समिती / प्रमुख (Supervisor Committee)
              </label>
              <input
                type="text"
                placeholder="उदा. जीर्णोद्धार बांधकाम समिती"
                value={config.supervisor_committee}
                onChange={(e) => setConfig({ ...config, supervisor_committee: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingConfig}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
          >
            {savingConfig ? 'जतन करत आहे...' : 'माहिती सेव्ह करा'}
          </button>
        </form>
      </div>

      {/* 2. Phase Form (Add / Edit) */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-base font-bold text-orange-800">
            {editingId ? '२. बांधकाम टप्पा संपादित करा (Edit Phase)' : '२. नवीन बांधकाम टप्पा जोडा (Add Phase)'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-stone-500 hover:text-stone-800 underline"
            >
              संपादित करणे रद्द करा
            </button>
          )}
        </div>

        <form onSubmit={handleSavePhase} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                टप्पा क्रमांक (Phase Number) *
              </label>
              <input
                type="text"
                placeholder="उदा. टप्पा ०१"
                value={phaseForm.phase_number}
                onChange={(e) => setPhaseForm({ ...phaseForm, phase_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                टप्प्याचे नाव / शीर्षक (Phase Title) *
              </label>
              <input
                type="text"
                placeholder="उदा. पायाभरणी व गर्भगृह पाया"
                value={phaseForm.phase_title}
                onChange={(e) => setPhaseForm({ ...phaseForm, phase_title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                सद्यस्थिती (Status)
              </label>
              <select
                value={phaseForm.status}
                onChange={(e) => setPhaseForm({ ...phaseForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white"
              >
                <option value="पूर्ण">पूर्ण (Completed)</option>
                <option value="प्रगतीपथावर">प्रगतीपथावर (In Progress)</option>
                <option value="नियोजित">नियोजित (Planned)</option>
                <option value="प्रलंबित">प्रलंबित (Pending)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                पूर्णतेची टक्केवारी (% Complete: 0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={phaseForm.completion_pct}
                onChange={(e) => setPhaseForm({ ...phaseForm, completion_pct: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                प्रदर्शन क्रम (Display Order)
              </label>
              <input
                type="number"
                min="1"
                value={phaseForm.display_order}
                onChange={(e) => setPhaseForm({ ...phaseForm, display_order: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">सुरूवात तारीख (Start Date)</label>
              <input
                type="text"
                placeholder="उदा. जानेवारी २०२४"
                value={phaseForm.start_date}
                onChange={(e) => setPhaseForm({ ...phaseForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">अपेक्षित पूर्णता तारीख (Target Date)</label>
              <input
                type="text"
                placeholder="उदा. मार्च २०२४"
                value={phaseForm.target_date}
                onChange={(e) => setPhaseForm({ ...phaseForm, target_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">अंदाजित खर्च (Estimated Cost)</label>
              <input
                type="text"
                placeholder="उदा. ₹ १२,००,०००"
                value={phaseForm.estimated_cost}
                onChange={(e) => setPhaseForm({ ...phaseForm, estimated_cost: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">झालेला खर्च (Spent Cost)</label>
              <input
                type="text"
                placeholder="उदा. ₹ ११,८५,०००"
                value={phaseForm.spent_cost}
                onChange={(e) => setPhaseForm({ ...phaseForm, spent_cost: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                साइट प्रगती फोटो लिंक (Image URL)
              </label>
              <input
                type="url"
                placeholder="https://example.com/construction.jpg"
                value={phaseForm.image_url}
                onChange={(e) => setPhaseForm({ ...phaseForm, image_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                टप्प्याचे सविस्तर वर्णन (Description) *
              </label>
              <textarea
                rows="3"
                placeholder="या टप्प्यात होणाऱ्या कामाचा सविस्तर तपशील..."
                value={phaseForm.description}
                onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ठळक प्रगती / चालू काम (Key Highlights)
              </label>
              <input
                type="text"
                placeholder="उदा. खांब उभारणी पूर्ण; भिंतींचे काम सुरू"
                value={phaseForm.key_highlights}
                onChange={(e) => setPhaseForm({ ...phaseForm, key_highlights: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                अभियंता / पर्यवेक्षक शेरा (Supervisor Note)
              </label>
              <input
                type="text"
                placeholder="उदा. काम वेळेत आणि दर्जानुसार सुरू आहे"
                value={phaseForm.supervisor_note}
                onChange={(e) => setPhaseForm({ ...phaseForm, supervisor_note: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active_phase"
                checked={phaseForm.is_active}
                onChange={(e) => setPhaseForm({ ...phaseForm, is_active: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-400 h-4 w-4"
              />
              <label htmlFor="is_active_phase" className="text-xs font-semibold text-stone-700 cursor-pointer">
                मुख्य पृष्ठावर प्रदर्शित करा (Is Active)
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingPhase}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm"
            >
              {savingPhase
                ? 'जतन करत आहे...'
                : editingId
                ? 'बदल जतन करा (Update Phase)'
                : 'टप्पा जोडा (Add Phase)'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold px-4 py-2 rounded-lg text-sm transition"
              >
                रद्द करा
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Existing Phases List with Inline Progress Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h3 className="font-bold text-stone-800 mb-4">
          विद्यमान बांधकाम टप्पे ({phases.length})
        </h3>
        <div className="space-y-4">
          {phases.map((p) => (
            <div
              key={p.id}
              className={`p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${
                editingId === p.id ? 'border-orange-500 bg-orange-50/30' : 'bg-stone-50/50 hover:bg-stone-50'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                    {p.phase_number}
                  </span>
                  <span className="text-xs text-stone-400 font-medium">#{p.display_order}</span>
                  {!p.is_active && (
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded font-semibold">
                      लपवलेले
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                  {p.phase_title}
                </h4>
                <p className="text-xs text-stone-500 line-clamp-1">{p.description}</p>
                {(p.estimated_cost || p.spent_cost) && (
                  <p className="text-xs text-stone-600">
                    खर्च: {p.spent_cost || '₹ ०'} / {p.estimated_cost || '₹ ०'}
                  </p>
                )}
              </div>

              {/* Inline Percentage & Status Update Controls */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <select
                  defaultValue={p.status}
                  onChange={(e) => handleQuickUpdate(p.id, e.target.value, p.completion_pct)}
                  className="text-xs border rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-orange-400"
                >
                  <option value="पूर्ण">पूर्ण</option>
                  <option value="प्रगतीपथावर">प्रगतीपथावर</option>
                  <option value="नियोजित">नियोजित</option>
                  <option value="प्रलंबित">प्रलंबित</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={p.completion_pct}
                    onBlur={(e) => handleQuickUpdate(p.id, p.status, e.target.value)}
                    className="w-16 border rounded-lg px-2 py-1 text-center text-xs font-bold bg-white focus:ring-1 focus:ring-orange-400"
                  />
                  <span className="text-xs font-bold text-stone-600">%</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleEditClick(p)}
                  className="text-stone-700 hover:text-stone-900 text-xs font-semibold border border-stone-300 hover:bg-stone-100 px-3 py-1.5 rounded-lg transition"
                >
                  संपादित करा
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600 hover:text-red-800 text-xs font-semibold border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                >
                  हटवा
                </button>
              </div>
            </div>
          ))}

          {phases.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-6">कोणतेही टप्पे उपलब्ध नाहीत.</p>
          )}
        </div>
      </div>
    </div>
  );
}