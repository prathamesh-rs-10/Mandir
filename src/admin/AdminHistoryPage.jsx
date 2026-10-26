import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const EMPTY_MILESTONE = {
  title: '',
  era_period: '',
  description: '',
  key_takeaway: '',
  source_reference: '',
  image_url: '',
  display_order: 1,
  is_active: true,
};

export default function AdminHistoryPage({ showNotification }) {
  // Page-level header settings
  const [config, setConfig] = useState({
    page_title: '',
    page_subtitle: '',
    intro_heading: '',
    intro_body: '',
  });

  // Timeline list & edit state
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState(EMPTY_MILESTONE);

  const [savingConfig, setSavingConfig] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [fetching, setFetching] = useState(true);

  const notify = (msg, type = 'success') => {
    if (typeof showNotification === 'function') {
      showNotification(msg, type);
    } else {
      alert(msg);
    }
  };

  const loadData = async () => {
    const [configRes, historyRes] = await Promise.all([
      supabase.from('mandir_history_config').select('*').limit(1).single(),
      supabase.from('mandir_history').select('*').order('display_order', { ascending: true }),
    ]);

    if (configRes.data) {
      setConfig({
        page_title: configRes.data.page_title ?? '',
        page_subtitle: configRes.data.page_subtitle ?? '',
        intro_heading: configRes.data.intro_heading ?? '',
        intro_body: configRes.data.intro_body ?? '',
      });
    }

    if (historyRes.data) {
      setItems(historyRes.data);
    }

    setFetching(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Header & Overview Configuration
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);

    const { error } = await supabase.from('mandir_history_config').upsert({
      id: 1,
      page_title: config.page_title,
      page_subtitle: config.page_subtitle,
      intro_heading: config.intro_heading,
      intro_body: config.intro_body,
      updated_at: new Date().toISOString(),
    });

    setSavingConfig(false);

    if (!error) {
      notify('पृष्ठ माहिती व पार्श्वभूमी यशस्वीरित्या सेव्ह झाली!');
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  // Create or Update Milestone
  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    setSavingMilestone(true);

    const payload = {
      title: milestoneForm.title,
      era_period: milestoneForm.era_period,
      description: milestoneForm.description,
      key_takeaway: milestoneForm.key_takeaway,
      source_reference: milestoneForm.source_reference,
      image_url: milestoneForm.image_url || null,
      display_order: parseInt(milestoneForm.display_order, 10) || 1,
      is_active: milestoneForm.is_active,
    };

    let result;
    if (editingId) {
      result = await supabase.from('mandir_history').update(payload).eq('id', editingId);
    } else {
      result = await supabase.from('mandir_history').insert([payload]);
    }

    setSavingMilestone(false);

    if (!result.error) {
      notify(editingId ? 'नोंद अद्ययावत केली!' : 'नवीन इतिहास नोंद जोडली!');
      setMilestoneForm(EMPTY_MILESTONE);
      setEditingId(null);
      loadData();
    } else {
      notify('त्रुटी: ' + result.error.message, 'error');
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setMilestoneForm({
      title: item.title ?? '',
      era_period: item.era_period ?? '',
      description: item.description ?? '',
      key_takeaway: item.key_takeaway ?? '',
      source_reference: item.source_reference ?? '',
      image_url: item.image_url ?? '',
      display_order: item.display_order ?? 1,
      is_active: item.is_active ?? true,
    });
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMilestoneForm(EMPTY_MILESTONE);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ही नोंद कायमस्वरूपी हटवायची आहे का?')) return;
    const { error } = await supabase.from('mandir_history').delete().eq('id', id);
    if (!error) {
      notify('नोंद हटवली.');
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
        <h2 className="text-xl font-bold text-stone-800">मंदिर इतिहास व्यवस्थापन (History CMS)</h2>
        <p className="text-xs text-stone-500 mt-1">
          इतिहास पृष्ठावरील मुख्य शीर्षक, प्रास्ताविक आणि सर्व ऐतिहासिक टप्पे येथून नियंत्रित करा.
        </p>
      </div>

      {/* 1. Page Header & Intro Section */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-orange-800 border-b pb-2">
          १. पृष्ठ शीर्षक व प्रास्ताविक (Header & Overview)
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
                उपशीर्षक / टॅगलाइन (Page Subtitle)
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
                प्रास्ताविक विभाग शीर्षक (Overview Heading)
              </label>
              <input
                type="text"
                value={config.intro_heading}
                onChange={(e) => setConfig({ ...config, intro_heading: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ऐतिहासिक पार्श्वभूमी / प्रास्ताविक मजकूर (Overview Body)
              </label>
              <textarea
                rows="4"
                value={config.intro_body}
                onChange={(e) => setConfig({ ...config, intro_body: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingConfig}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
          >
            {savingConfig ? 'जतन करत आहे...' : 'पृष्ठ माहिती सेव्ह करा'}
          </button>
        </form>
      </div>

      {/* 2. Timeline Milestone Form */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-base font-bold text-orange-800">
            {editingId ? '२. ऐतिहासिक नोंद संपादित करा (Edit Milestone)' : '२. नवीन ऐतिहासिक नोंद जोडा (Add Milestone)'}
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

        <form onSubmit={handleSaveMilestone} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                कालखंड / वर्ष (Era / Period)
              </label>
              <input
                type="text"
                placeholder="उदा. प्राचीन स्थापना काळ / १८ वे शतक"
                value={milestoneForm.era_period}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, era_period: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                नोंदीचे शीर्षक (Milestone Title) *
              </label>
              <input
                type="text"
                placeholder="उदा. मंदिराचा उगम व स्वयंभू प्रकटीकरण"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                प्रदर्शन क्रम (Display Order)
              </label>
              <input
                type="number"
                min="1"
                value={milestoneForm.display_order}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, display_order: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                संदर्भ छायाचित्र लिंक (Optional Image URL)
              </label>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={milestoneForm.image_url}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, image_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                सविस्तर इतिहास व माहिती (Description) *
              </label>
              <textarea
                rows="4"
                placeholder="या कालखंडातील सविस्तर इतिहास आणि घटना..."
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ठळक महत्त्व / विशेष वैशिष्ट्य (Key Highlight / Takeaway)
              </label>
              <input
                type="text"
                placeholder="उदा. ग्रामस्थांचे कुलदैवत व अखंड रक्षणकर्ती माता"
                value={milestoneForm.key_takeaway}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, key_takeaway: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ऐतिहासिक संदर्भ / दाखला (Source Reference)
              </label>
              <input
                type="text"
                placeholder="उदा. ग्राम नोंद वही / मौखिक परंपरा"
                value={milestoneForm.source_reference}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, source_reference: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active"
                checked={milestoneForm.is_active}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, is_active: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-400 h-4 w-4"
              />
              <label htmlFor="is_active" className="text-xs font-semibold text-stone-700 cursor-pointer">
                मुख्य पृष्ठावर प्रदर्शित करा (Is Active)
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingMilestone}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm"
            >
              {savingMilestone
                ? 'जतन करत आहे...'
                : editingId
                ? 'बदल जतन करा (Update)'
                : 'नोंद जोडा (Add Milestone)'}
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

      {/* 3. Existing Milestones List */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h3 className="font-bold text-stone-800 mb-4">
          विद्यमान इतिहास नोंदी ({items.length})
        </h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4 transition ${
                editingId === item.id ? 'border-orange-500 bg-orange-50/30' : 'hover:bg-stone-50'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    #{item.display_order}
                  </span>
                  {item.era_period && (
                    <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                      {item.era_period}
                    </span>
                  )}
                  {!item.is_active && (
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      लपवलेले (Hidden)
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-stone-900 text-base">{item.title}</h4>
                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
                {item.key_takeaway && (
                  <p className="text-xs text-amber-800 font-medium">
                    विशेष: {item.key_takeaway}
                  </p>
                )}
                {item.source_reference && (
                  <p className="text-xs text-stone-400 italic">
                    संदर्भ: {item.source_reference}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEditClick(item)}
                  className="text-stone-700 hover:text-stone-900 text-xs font-semibold border border-stone-300 hover:bg-stone-100 px-3 py-1.5 rounded-lg transition"
                >
                  संपादित करा
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-800 text-xs font-semibold border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                >
                  हटवा
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-6">नोंदी उपलब्ध नाहीत.</p>
          )}
        </div>
      </div>
    </div>
  );
}