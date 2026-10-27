import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CATEGORIES = [
  'वार्षिक उत्सव',
  'धार्मिक विधी',
  'विशेष सोहळा',
  'बैठक व सभा',
  'पालखी सोहळा',
  'भंडारा व महाप्रसाद',
];

const INITIAL_EVENT_STATE = {
  title: '',
  subtitle: '',
  event_category: 'वार्षिक उत्सव',
  event_date: '',
  end_date: '',
  event_time: '',
  location: 'श्री काळंबादेवी मंदिर परिसर, शेरपे',
  description: '',
  attractions: '',
  schedule_details: '',
  banner_url: '',
  contact_person: '',
  contact_phone: '',
  is_featured: false,
  status: 'आगामी',
  is_active: true,
};

export default function AdminEventsPage({ showNotification }) {
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState(INITIAL_EVENT_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Section config state
  const [config, setConfig] = useState({
    page_tag: '',
    page_title: '',
    page_description: '',
    show_featured_banner: true,
    show_category_filter: true,
    show_volunteer_feature: true,
    show_completed_events: true,
    show_share_button: true,
  });

  const notify = (msg, type = 'success') => {
    if (typeof showNotification === 'function') {
      showNotification(msg, type);
    } else {
      alert(msg);
    }
  };

  const loadData = async () => {
    setLoading(true);

    // 1. Fetch Events
    const { data: eventsData, error: eventsError } = await supabase
      .from('mandir_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (eventsData) setEvents(eventsData);
    if (eventsError) notify('कार्यक्रम लोड करताना त्रुटी: ' + eventsError.message, 'error');

    // 2. Fetch Config
    const { data: configData } = await supabase
      .from('mandir_events_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configData) setConfig(configData);

    // 3. Fetch Volunteers
    const { data: volData } = await supabase
      .from('mandir_event_volunteers')
      .select('*')
      .order('created_at', { ascending: false });

    if (volData) setVolunteers(volData);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── EVENT HANDLERS ───
  const handleOpenAddModal = () => {
    setFormData(INITIAL_EVENT_STATE);
    setIsEditing(false);
    setEditingId(null);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (event) => {
    setFormData({
      title: event.title || '',
      subtitle: event.subtitle || '',
      event_category: event.event_category || 'वार्षिक उत्सव',
      event_date: event.event_date || '',
      end_date: event.end_date || '',
      event_time: event.event_time || '',
      location: event.location || 'श्री काळंबादेवी मंदिर परिसर, शेरपे',
      description: event.description || '',
      attractions: event.attractions || '',
      schedule_details: event.schedule_details || '',
      banner_url: event.banner_url || '',
      contact_person: event.contact_person || '',
      contact_phone: event.contact_phone || '',
      is_featured: event.is_featured ?? false,
      status: event.status || 'आगामी',
      is_active: event.is_active ?? true,
    });
    setIsEditing(true);
    setEditingId(event.id);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.event_date) {
      notify('कार्यक्रमाचे नाव आणि तारीख भरणे आवश्यक आहे.', 'error');
      return;
    }

    const payload = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      updated_at: new Date().toISOString(),
    };

    if (isEditing && editingId) {
      const { error } = await supabase
        .from('mandir_events')
        .update(payload)
        .eq('id', editingId);

      if (!error) {
        notify('कार्यक्रम यशस्वीरित्या अद्ययावत केला!');
        setShowFormModal(false);
        loadData();
      } else {
        notify('त्रुटी: ' + error.message, 'error');
      }
    } else {
      const { error } = await supabase.from('mandir_events').insert([payload]);
      if (!error) {
        notify('नवीन कार्यक्रम यशस्वीरित्या जोडला!');
        setShowFormModal(false);
        loadData();
      } else {
        notify('त्रुटी: ' + error.message, 'error');
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('हा कार्यक्रम नक्की हटवायचा आहे का?')) return;
    const { error } = await supabase.from('mandir_events').delete().eq('id', id);
    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      notify('कार्यक्रम हटवला.');
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  const toggleEventVisibility = async (id, currentStatus) => {
    const updated = !currentStatus;
    const { error } = await supabase
      .from('mandir_events')
      .update({ is_active: updated, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_active: updated } : e))
      );
      notify(updated ? 'कार्यक्रम वेबसाईटवर दाखवला.' : 'कार्यक्रम लपवला.');
    }
  };

  const toggleFeaturedStatus = async (id, currentStatus) => {
    const updated = !currentStatus;
    const { error } = await supabase
      .from('mandir_events')
      .update({ is_featured: updated, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_featured: updated } : e))
      );
      notify(updated ? 'प्रमुख आगामी उत्सव म्हणून निवडले ⭐' : 'प्रमुख उत्सवातून काढले.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase
      .from('mandir_events')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      notify(`स्थिती बदलली: ${newStatus}`);
    }
  };

  // ─── CONFIG SAVE HANDLER ───
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('mandir_events_config')
      .upsert({ id: 1, ...config, updated_at: new Date().toISOString() });

    if (!error) {
      notify('वेबसाईट विभाग सेटिंग्ज जतन झाल्या!');
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  // ─── VOLUNTEER ACTIONS ───
  const toggleVolunteerStatus = async (id, currentStatus) => {
    const updated = currentStatus === 'confirmed' ? 'pending' : 'confirmed';
    const { error } = await supabase
      .from('mandir_event_volunteers')
      .update({ status: updated })
      .eq('id', id);

    if (!error) {
      setVolunteers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: updated } : v))
      );
      notify(updated === 'confirmed' ? 'सेवा नोंदणी स्वीकृत केली.' : 'प्रलंबित ठेवली.');
    }
  };

  const handleDeleteVolunteer = async (id) => {
    if (!window.confirm('हा सेवा अर्ज हटवायचा आहे का?')) return;
    const { error } = await supabase.from('mandir_event_volunteers').delete().eq('id', id);
    if (!error) {
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
      notify('नोंद हटवली.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-2 sm:p-4">
      {/* ─── HEADER ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            कार्यक्रम व उत्सव व्यवस्थापन (Events CMS)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            वेबसाईटवरील धार्मिक उत्सव, रूपरेषा, विभाग सेटिंग्ज आणि स्वयंसेवक नोंदणी व्यवस्थापित करा.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2"
        >
          <span>+</span>
          <span>नवीन कार्यक्रम जोडा</span>
        </button>
      </div>

      {/* ─── SECTION 1: ALL EVENTS LIST ─── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-2">
          <div>
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <span>📅</span>
              <span>सर्व उत्सव व कार्यक्रम (Events List)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              येथून सर्व कार्यक्रमांची माहिती संपादित करा, लपवा किंवा प्रमुख उत्सव निवडा.
            </p>
          </div>
          <span className="text-xs bg-orange-50 text-orange-800 border border-orange-200 font-semibold px-3 py-1 rounded-full">
            एकूण: {events.length} | आगामी: {events.filter((e) => e.status !== 'संपन्न').length}
          </span>
        </div>

        {loading ? (
          <p className="text-center py-10 text-xs text-gray-400">माहिती लोड होत आहे...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            कोणतेही कार्यक्रम उपलब्ध नाहीत. "नवीन कार्यक्रम जोडा" वर क्लिक करा.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className={`p-4 sm:p-5 border rounded-2xl transition-all ${
                  !ev.is_active
                    ? 'bg-gray-50/70 border-dashed border-gray-300 opacity-70'
                    : 'bg-white border-gray-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-md">
                        {ev.event_category}
                      </span>
                      {ev.is_featured && (
                        <span className="text-[11px] font-bold bg-amber-400 text-orange-950 px-2 py-0.5 rounded-md">
                          ⭐ प्रमुख उत्सव (Mega Banner)
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          ev.status === 'संपन्न'
                            ? 'bg-gray-200 text-gray-700'
                            : ev.status === 'चालू'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ev.status}
                      </span>
                      {!ev.is_active && (
                        <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-medium">
                          वेबसाईटवर लपवले आहे (Hidden)
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-gray-900">{ev.title}</h4>
                    {ev.subtitle && (
                      <p className="text-xs font-semibold text-orange-700">{ev.subtitle}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                      <span>
                        📅 <strong>तारीख:</strong> {ev.event_date}
                        {ev.end_date ? ` ते ${ev.end_date}` : ''}
                      </span>
                      <span>⏰ <strong>वेळ:</strong> {ev.event_time || 'दिवसभर'}</span>
                      <span>📍 <strong>स्थान:</strong> {ev.location}</span>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{ev.description}</p>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    <select
                      value={ev.status || 'आगामी'}
                      onChange={(e) => handleStatusChange(ev.id, e.target.value)}
                      className="text-xs border rounded-lg px-2 py-1.5 bg-gray-50 font-medium"
                    >
                      <option value="आगामी">आगामी (Upcoming)</option>
                      <option value="चालू">चालू (Live)</option>
                      <option value="संपन्न">संपन्न (Completed)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => toggleFeaturedStatus(ev.id, ev.is_featured)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                        ev.is_featured
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      title="प्रमुख बॅनरवर प्रदर्शित करा"
                    >
                      {ev.is_featured ? '★ प्रमुख' : '☆ प्रमुख करा'}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleEventVisibility(ev.id, ev.is_active)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                        ev.is_active
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'border-emerald-300 text-emerald-700 bg-emerald-50'
                      }`}
                    >
                      {ev.is_active ? 'लपवा' : 'दाखवा'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(ev)}
                      className="text-xs text-blue-600 border border-blue-200 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg font-semibold"
                    >
                      बदला
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-xs text-red-600 border border-red-200 bg-red-50/50 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-semibold"
                    >
                      हटवा
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SECTION 2: WEBSITE DISPLAY CONTROLLER ─── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="border-b pb-3">
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <span>⚙️</span>
              <span>वेबसाईट विभाग नियंत्रक (Display Controls)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              येथील सेटिंग्जद्वारे तुम्ही ठरवू शकता की उत्सव पानावर कोणते विभाग आणि फीचर्स भाविकांना दिसावेत.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.show_featured_banner}
                onChange={(e) => setConfig({ ...config, show_featured_banner: e.target.checked })}
                className="h-4 w-4 text-orange-600 rounded"
              />
              <span className="text-xs font-semibold text-gray-700">
                प्रमुख आगामी उत्सव महा-बॅनर (Mega Banner)
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.show_category_filter}
                onChange={(e) => setConfig({ ...config, show_category_filter: e.target.checked })}
                className="h-4 w-4 text-orange-600 rounded"
              />
              <span className="text-xs font-semibold text-gray-700">
                उत्सव वर्गवारी फिल्टर्स (Category Filter Tabs)
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.show_volunteer_feature}
                onChange={(e) => setConfig({ ...config, show_volunteer_feature: e.target.checked })}
                className="h-4 w-4 text-orange-600 rounded"
              />
              <span className="text-xs font-semibold text-gray-700">
                स्वयंसेवक सेवा नोंदणी बटण व फॉर्म (Volunteer Modal)
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.show_completed_events}
                onChange={(e) => setConfig({ ...config, show_completed_events: e.target.checked })}
                className="h-4 w-4 text-orange-600 rounded"
              />
              <span className="text-xs font-semibold text-gray-700">
                संपन्न झालेले कार्यक्रम यादीत दाखवा (Past Events)
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.show_share_button}
                onChange={(e) => setConfig({ ...config, show_share_button: e.target.checked })}
                className="h-4 w-4 text-orange-600 rounded"
              />
              <span className="text-xs font-semibold text-gray-700">
                कार्यक्रम माहिती शेअर बटण (Share Button)
              </span>
            </label>
          </div>

          <div className="pt-4 border-t space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">
              पानावरील मुख्य मजकूर व मथळा (Page Header Content)
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  घोषवाक्य टॅग (Page Tag)
                </label>
                <input
                  type="text"
                  value={config.page_tag || ''}
                  onChange={(e) => setConfig({ ...config, page_tag: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  पानाचे मुख्य नाव (Page Title)
                </label>
                <input
                  type="text"
                  value={config.page_title || ''}
                  onChange={(e) => setConfig({ ...config, page_title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  सविस्तर वर्णन (Page Description)
                </label>
                <textarea
                  rows="2"
                  value={config.page_description || ''}
                  onChange={(e) => setConfig({ ...config, page_description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow transition"
            >
              सेटिंग्ज जतन करा (Save Settings)
            </button>
          </div>
        </form>
      </section>

      {/* ─── SECTION 3: VOLUNTEER REGISTRATIONS ─── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-2">
          <div>
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <span>🙏</span>
              <span>सेवा स्वयंसेवक अर्ज (Volunteer Registrations)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              भाविक उत्सवामध्ये सेवेसाठी नोंदवलेली नावे व संपर्क माहिती.
            </p>
          </div>
          <span className="text-xs bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full">
            एकूण अर्ज: {volunteers.length}
          </span>
        </div>

        {volunteers.length === 0 ? (
          <p className="text-center py-10 text-xs text-gray-400">अद्याप सेवा अर्ज आलेले नाहीत.</p>
        ) : (
          <div className="space-y-3">
            {volunteers.map((vol) => (
              <div
                key={vol.id}
                className={`p-4 border rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4 ${
                  vol.status === 'confirmed' ? 'bg-emerald-50/30 border-emerald-200' : 'bg-gray-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                      {vol.event_title || 'उत्सव सेवा'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        vol.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {vol.status === 'confirmed' ? 'स्वीकृत (Confirmed)' : 'प्रलंबित (Pending)'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(vol.created_at).toLocaleDateString('mr-IN')}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm">{vol.volunteer_name}</h4>
                  <p className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                    <span>📞 <strong>मोबाईल:</strong> {vol.phone}</span>
                    <span>📍 <strong>गाव/शहर:</strong> {vol.city}</span>
                  </p>
                  <p className="text-xs text-orange-900 font-medium">
                    🙏 <strong>इच्छुक सेवा:</strong> {vol.seva_type}
                  </p>
                  {vol.message && (
                    <p className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border mt-1">
                      "{vol.message}"
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-center">
                  <a
                    href={`tel:${vol.phone.replace(/[^0-9+]/g, '')}`}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    कॉल करा
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleVolunteerStatus(vol.id, vol.status)}
                    className="border border-gray-300 hover:bg-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    {vol.status === 'confirmed' ? 'प्रलंबित करा' : 'स्वीकृत करा'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVolunteer(vol.id)}
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                  >
                    हटवा
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── ADD / EDIT EVENT MODAL ─── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-gray-200">
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
              {isEditing ? 'कार्यक्रमाची माहिती संपादित करा' : 'नवीन कार्यक्रम जोडा'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    कार्यक्रमाचे नाव (Event Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. श्री काळंबादेवी वार्षिक जत्रोत्सव"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    उपशीर्षक (Subtitle)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. महापूजा, पालखी मिरवणूक व महाप्रसाद"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">वर्गवारी</label>
                  <select
                    value={formData.event_category}
                    onChange={(e) => setFormData({ ...formData, event_category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">सुरुवात तारीख *</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">समाप्ती तारीख (ऐच्छिक)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">वेळ</label>
                  <input
                    type="text"
                    placeholder="उदा. सकाळी ८:०० ते रात्रौ १०:००"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">स्थान</label>
                  <input
                    type="text"
                    placeholder="उदा. श्री काळंबादेवी मंदिर परिसर, शेरपे"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">सविस्तर वर्णन</label>
                  <textarea
                    rows="3"
                    placeholder="कार्यक्रमाविषयी संपूर्ण माहिती..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ठळक वैशिष्ट्ये (स्वल्पविरामाने वेगळे करा)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. अखंड हरिनाम सप्ताह, पालखी सोहळा, महाप्रसाद"
                    value={formData.attractions}
                    onChange={(e) => setFormData({ ...formData, attractions: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">बॅनर फोटो URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.banner_url}
                    onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    दैनंदिन रूपरेषा व वेळापत्रक (Schedule)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="उदा. सकाळी ६:०० - काकड आरती | दुपारी १२:०० - महाप्रसाद"
                    value={formData.schedule_details}
                    onChange={(e) => setFormData({ ...formData, schedule_details: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">संयोजक / संपर्क व्यक्ती</label>
                  <input
                    type="text"
                    placeholder="उदा. श्री. शांताराम सावंत"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">संपर्क मोबाईल क्र.</label>
                  <input
                    type="text"
                    placeholder="उदा. 98XXXXXXXX"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2 border-t">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded text-amber-500 h-4 w-4"
                    />
                    <span>⭐ प्रमुख आगामी उत्सव म्हणून दाखवा (Top Mega Banner)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-orange-600 h-4 w-4"
                    />
                    <span>वेबसाईटवर लगेच दाखवा (Visible on frontend)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 rounded-xl border text-gray-700 text-xs font-bold hover:bg-gray-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition"
                >
                  {isEditing ? 'बदल सेव्ह करा' : 'कार्यक्रम जोडा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
