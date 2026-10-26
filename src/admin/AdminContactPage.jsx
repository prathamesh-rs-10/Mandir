import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const INITIAL_FORM_STATE = {
  trust_name: '',
  reg_number: '',
  address: '',
  phone_primary: '',
  phone_secondary: '',
  email: '',
  darshan_timings: '',
  map_link: '',
  map_embed_url: '',
  plus_code: '',
  nearest_railway: '',
  how_to_reach_road: '',
  how_to_reach_bus: '',
  nearest_airport: '',
  aarti_schedule: '',
  mandir_rules: '',
  bank_name: '',
  bank_acc_no: '',
  bank_ifsc: '',
  bank_branch: '',
  upi_id: '',
  // Section visibility flags
  show_map_section: true,
  show_transport_section: true,
  show_darshan_rules_section: true,
  show_banking_section: true,
  show_secondary_phone: true,
  show_email: true,
};

export default function AdminContactPage({ showNotification }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('details');
  const [enquiryFilter, setEnquiryFilter] = useState('ALL');
  const [editingEnquiryId, setEditingEnquiryId] = useState(null);
  const [enquiryDraft, setEnquiryDraft] = useState({ status: 'pending', admin_notes: '' });

  const loadData = async () => {
    setLoading(true);

    // Load contact info
    const { data: infoData, error: infoError } = await supabase
      .from('mandir_contact_info')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (infoData) {
      setFormData({ ...INITIAL_FORM_STATE, ...infoData });
    } else if (infoError) {
      showNotification?.('माहिती लोड करताना त्रुटी: ' + infoError.message, 'error');
    }

    // Load enquiries
    const { data: enqData, error: enqError } = await supabase
      .from('mandir_enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (enqData) {
      setEnquiries(enqData);
    } else if (enqError) {
      showNotification?.('संदेश लोड करताना त्रुटी: ' + enqError.message, 'error');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update formData fields
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 1. SAVE CONTACT & VISIBILITY SETTINGS
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      id: formData.id || 1,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('mandir_contact_info').upsert(payload);

    setLoading(false);
    if (!error) {
      showNotification?.('सर्व संपर्क, विभाग दृश्यमानता व बँक माहिती यशस्वीरित्या सेव्ह झाली!');
    } else {
      showNotification?.('त्रुटी: ' + error.message, 'error');
    }
  };

  // 2. ENQUIRY STATUS & NOTE UPDATE
  const handleStartEditEnquiry = (enq) => {
    setEditingEnquiryId(enq.id);
    setEnquiryDraft({
      status: enq.status || 'pending',
      admin_notes: enq.admin_notes || '',
    });
  };

  const handleSaveEnquiryDetails = async (id) => {
    const { error } = await supabase
      .from('mandir_enquiries')
      .update({
        status: enquiryDraft.status,
        admin_notes: enquiryDraft.admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: enquiryDraft.status, admin_notes: enquiryDraft.admin_notes } : e
        )
      );
      setEditingEnquiryId(null);
      showNotification?.('संदेश स्थिती व टीप अद्ययावत केली!');
    } else {
      showNotification?.('त्रुटी: ' + error.message, 'error');
    }
  };

  // 3. DELETE ENQUIRY
  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('हा संदेश कायमचा हटवायचा आहे का?')) return;

    const { error } = await supabase.from('mandir_enquiries').delete().eq('id', id);
    if (!error) {
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      showNotification?.('संदेश हटवला.');
    } else {
      showNotification?.('त्रुटी: ' + error.message, 'error');
    }
  };

  const filteredEnquiries = enquiries.filter((e) => {
    if (enquiryFilter === 'ALL') return true;
    return (e.status || 'pending') === enquiryFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* ─── TAB NAVIGATION ─── */}
      <div className="flex space-x-3 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('details')}
          className={`pb-2 px-3 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'details'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          📍 पत्ता, नकाशे व विभाग सेटिंग्ज
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('enquiries')}
          className={`pb-2 px-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'enquiries'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>✉️ भाविक विचारणा / संदेश</span>
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {enquiries.length}
          </span>
        </button>
      </div>

      {activeSubTab === 'details' ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* ─── 1. CORE TEMPLE CONTACT ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
              <span>🛕</span>
              <span>कमिटी माहिती व संपर्क तपशील</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">कमिटी / ट्रस्टचे नाव</label>
                <input
                  type="text"
                  value={formData.trust_name || ''}
                  onChange={(e) => handleChange('trust_name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. श्री सिद्धिविनायक देवस्थान ट्रस्ट"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">नोंदणी क्रमांक / मंडळ</label>
                <input
                  type="text"
                  value={formData.reg_number || ''}
                  onChange={(e) => handleChange('reg_number', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. A-1234/पुणे"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">संपूर्ण मंदिर पत्ता</label>
                <textarea
                  rows="2"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="गट क्र., पोस्ट, तालुका, जिल्हा, पिन कोड"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">प्राथमिक फोन (मोबाईल) *</label>
                <input
                  type="text"
                  required
                  value={formData.phone_primary || ''}
                  onChange={(e) => handleChange('phone_primary', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-600">दुय्यम फोन</label>
                  <label className="text-[11px] text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_secondary_phone}
                      onChange={(e) => handleChange('show_secondary_phone', e.target.checked)}
                      className="rounded text-orange-600 h-3.5 w-3.5"
                    />
                    वेबसाइटवर दाखवा
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.phone_secondary || ''}
                  onChange={(e) => handleChange('phone_secondary', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    !formData.show_secondary_phone ? 'bg-gray-100 text-gray-400' : ''
                  }`}
                  placeholder="पर्यायी फोन क्रमांक"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-600">ईमेल पत्ता</label>
                  <label className="text-[11px] text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_email}
                      onChange={(e) => handleChange('show_email', e.target.checked)}
                      className="rounded text-orange-600 h-3.5 w-3.5"
                    />
                    वेबसाइटवर दाखवा
                  </label>
                </div>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    !formData.show_email ? 'bg-gray-100 text-gray-400' : ''
                  }`}
                  placeholder="contact@mandirtrust.org"
                />
              </div>
            </div>
          </div>

          {/* ─── 2. DARSHAN TIMINGS & RULES ─── */}
          <div
            className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${
              !formData.show_darshan_rules_section ? 'border-dashed border-gray-300 bg-gray-50/50' : 'border-gray-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 border-b pb-2">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span>🪔</span>
                <span>दर्शन वेळा, आरती व शिष्टाचार नियम</span>
              </h2>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <input
                  type="checkbox"
                  checked={formData.show_darshan_rules_section}
                  onChange={(e) => handleChange('show_darshan_rules_section', e.target.checked)}
                  className="h-4 w-4 text-orange-600 rounded"
                />
                <span>हा विभाग वेबसाइटवर दाखवा</span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">दर्शन वेळा</label>
                <input
                  type="text"
                  value={formData.darshan_timings || ''}
                  onChange={(e) => handleChange('darshan_timings', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. सकाळी ६:०० ते रात्री ९:००"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">आरती वेळापत्रक संक्षिप्त</label>
                <input
                  type="text"
                  value={formData.aarti_schedule || ''}
                  onChange={(e) => handleChange('aarti_schedule', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. काकड आरती: पहाटे ५:३० | संध्या आरती: सायं ७:३०"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">भाविकांसाठी नियम व शिष्टाचार</label>
                <textarea
                  rows="3"
                  value={formData.mandir_rules || ''}
                  onChange={(e) => handleChange('mandir_rules', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. मंदिरात शांतता राखा, मोबाईल सायलेंटवर ठेवा, पारंपारिक पोशाख परिधान करा."
                />
              </div>
            </div>
          </div>

          {/* ─── 3. GOOGLE MAPS & LOCATION ─── */}
          <div
            className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${
              !formData.show_map_section ? 'border-dashed border-gray-300 bg-gray-50/50' : 'border-gray-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 border-b pb-2">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span>🗺️</span>
                <span>गुगल मॅप व भौगोलिक स्थान</span>
              </h2>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <input
                  type="checkbox"
                  checked={formData.show_map_section}
                  onChange={(e) => handleChange('show_map_section', e.target.checked)}
                  className="h-4 w-4 text-orange-600 rounded"
                />
                <span>मॅप विभाग वेबसाइटवर दाखवा</span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Google Maps शेअर लिंक</label>
                <input
                  type="url"
                  value={formData.map_link || ''}
                  onChange={(e) => handleChange('map_link', e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Google Maps Plus Code</label>
                <input
                  type="text"
                  value={formData.plus_code || ''}
                  onChange={(e) => handleChange('plus_code', e.target.value)}
                  placeholder="GMRM+FPF, Pune, Maharashtra"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Google Map Embed URL (iframe src लिंक)
                </label>
                <input
                  type="text"
                  value={formData.map_embed_url || ''}
                  onChange={(e) => handleChange('map_embed_url', e.target.value)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* ─── 4. TRANSPORT & HOW TO REACH ─── */}
          <div
            className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${
              !formData.show_transport_section ? 'border-dashed border-gray-300 bg-gray-50/50' : 'border-gray-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 border-b pb-2">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span>🚆</span>
                <span>कसे पोहोचावे? प्रवास माहिती (Travel Routes)</span>
              </h2>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <input
                  type="checkbox"
                  checked={formData.show_transport_section}
                  onChange={(e) => handleChange('show_transport_section', e.target.checked)}
                  className="h-4 w-4 text-orange-600 rounded"
                />
                <span>प्रवास विभाग वेबसाइटवर दाखवा</span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">रेल्वे मार्ग (Nearest Railway)</label>
                <textarea
                  rows="2"
                  value={formData.nearest_railway || ''}
                  onChange={(e) => handleChange('nearest_railway', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. जवळचे रेल्वे स्थानक: पुणे जंक्शन (१५ किमी), तिथून रिक्षा किंवा बस उपलब्ध."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">रस्ता मार्ग (Roadway)</label>
                <textarea
                  rows="2"
                  value={formData.how_to_reach_road || ''}
                  onChange={(e) => handleChange('how_to_reach_road', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. पुणे-सोलापूर महामार्गावरून थेट फाटा उपलब्ध."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">एस.टी. बस मार्ग (Bus Route)</label>
                <textarea
                  rows="2"
                  value={formData.how_to_reach_bus || ''}
                  onChange={(e) => handleChange('how_to_reach_bus', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. स्वारगेट बस स्थानकावरून दर ३० मिनिटांनी बस उपलब्ध."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">विमान मार्ग (Nearest Airport)</label>
                <textarea
                  rows="2"
                  value={formData.nearest_airport || ''}
                  onChange={(e) => handleChange('nearest_airport', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="उदा. लोहगाव विमानतळ पुणे (२२ किमी)."
                />
              </div>
            </div>
          </div>

          {/* ─── 5. BANK ACCOUNT & UPI DONATIONS ─── */}
          <div
            className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${
              !formData.show_banking_section ? 'border-dashed border-gray-300 bg-gray-50/50' : 'border-gray-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 border-b pb-2">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span>🏛️</span>
                <span>बँक खाते व देणगी UPI तपशील</span>
              </h2>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <input
                  type="checkbox"
                  checked={formData.show_banking_section}
                  onChange={(e) => handleChange('show_banking_section', e.target.checked)}
                  className="h-4 w-4 text-orange-600 rounded"
                />
                <span>बँक/UPI विभाग वेबसाइटवर दाखवा</span>
              </label>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">बँकेचे नाव</label>
                <input
                  type="text"
                  value={formData.bank_name || ''}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="State Bank of India"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">खाते क्रमांक</label>
                <input
                  type="text"
                  value={formData.bank_acc_no || ''}
                  onChange={(e) => handleChange('bank_acc_no', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  placeholder="30123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">IFSC कोड</label>
                <input
                  type="text"
                  value={formData.bank_ifsc || ''}
                  onChange={(e) => handleChange('bank_ifsc', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase"
                  placeholder="SBIN0001234"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">शाखा (Branch)</label>
                <input
                  type="text"
                  value={formData.bank_branch || ''}
                  onChange={(e) => handleChange('bank_branch', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="मुख्य शाखा"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">अधिकृत देणगी UPI ID</label>
                <input
                  type="text"
                  value={formData.upi_id || ''}
                  onChange={(e) => handleChange('upi_id', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  placeholder="mandirtrust@sbi"
                />
              </div>
            </div>
          </div>

          {/* ─── SAVE BUTTON ─── */}
          <div className="sticky bottom-4 bg-white/90 backdrop-blur p-4 rounded-xl border shadow-lg flex items-center justify-between">
            <span className="text-xs text-gray-500 hidden sm:inline">
              केलेले सर्व बदल व विभाग दृश्यमानता एका क्लिकवर जतन करा.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow transition disabled:opacity-50"
            >
              {loading ? 'जतन करत आहे...' : 'सर्व माहिती सेव्ह करा (Save All Changes)'}
            </button>
          </div>
        </form>
      ) : (
        /* ─── ENQUIRIES TAB ─── */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-base">भाविकांचे संदेश व विचारणा ({enquiries.length})</h3>
              <p className="text-xs text-gray-500">संदेशाची स्थिती बदला, नोंद ठेवा किंवा संदेश हटवा.</p>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">स्थिती:</span>
              <select
                value={enquiryFilter}
                onChange={(e) => setEnquiryFilter(e.target.value)}
                className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50"
              >
                <option value="ALL">सर्व संदेश ({enquiries.length})</option>
                <option value="pending">प्रलंबित (Pending)</option>
                <option value="contacted">संपर्क केला (Contacted)</option>
                <option value="resolved">सोडवले (Resolved)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEnquiries.map((enq) => {
              const isEditing = editingEnquiryId === enq.id;
              const sanitizedPhone = (enq.phone || '').replace(/[^0-9]/g, '');

              return (
                <div
                  key={enq.id}
                  className={`p-4 border rounded-xl transition ${
                    enq.status === 'resolved'
                      ? 'bg-gray-50/60 border-gray-200'
                      : enq.status === 'contacted'
                      ? 'bg-blue-50/20 border-blue-200'
                      : 'bg-orange-50/20 border-orange-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                          {enq.subject || 'सामान्य विचारणा'}
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            enq.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : enq.status === 'contacted'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {enq.status === 'resolved'
                            ? 'सोडवले (Resolved)'
                            : enq.status === 'contacted'
                            ? 'संपर्क साधला (Contacted)'
                            : 'नवीन / प्रलंबित (Pending)'}
                        </span>

                        <span className="text-xs text-gray-400">
                          {new Date(enq.created_at).toLocaleString('mr-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm">{enq.name}</h4>
                      <p className="text-xs text-gray-600">
                        📞 <strong>मोबाईल:</strong> {enq.phone}{' '}
                        {enq.email && (
                          <>
                            • ✉️ <strong>ईमेल:</strong> {enq.email}
                          </>
                        )}
                      </p>

                      <p className="text-xs text-gray-800 bg-white p-3 rounded-lg border mt-2 whitespace-pre-wrap">
                        "{enq.message}"
                      </p>

                      {enq.admin_notes && !isEditing && (
                        <p className="text-xs text-purple-800 bg-purple-50 p-2 rounded border border-purple-200 mt-2">
                          <strong>कमिटी टीप:</strong> {enq.admin_notes}
                        </p>
                      )}

                      {/* Inline Status/Notes Editor */}
                      {isEditing && (
                        <div className="bg-white p-3 border border-orange-200 rounded-lg mt-3 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] text-gray-600 font-semibold">स्थिती बदला</label>
                              <select
                                value={enquiryDraft.status}
                                onChange={(e) => setEnquiryDraft({ ...enquiryDraft, status: e.target.value })}
                                className="w-full text-xs border rounded p-1.5"
                              >
                                <option value="pending">नवीन / प्रलंबित (Pending)</option>
                                <option value="contacted">संपर्क साधला (Contacted)</option>
                                <option value="resolved">सोडवले / पूर्ण (Resolved)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-600 font-semibold">अंतर्गत टीप (Admin Note)</label>
                              <input
                                type="text"
                                placeholder="उदा. फोनवर बोलणे झाले, माहिती दिली."
                                value={enquiryDraft.admin_notes}
                                onChange={(e) => setEnquiryDraft({ ...enquiryDraft, admin_notes: e.target.value })}
                                className="w-full text-xs border rounded p-1.5"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEnquiryDetails(enq.id)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded"
                            >
                              जतन करा
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingEnquiryId(null)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1 rounded"
                            >
                              रद्द करा
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-stretch gap-2 shrink-0">
                      <a
                        href={`tel:${sanitizedPhone}`}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs text-center font-semibold px-3 py-1.5 rounded-lg"
                      >
                        कॉल करा
                      </a>

                      {sanitizedPhone.length >= 10 && (
                        <a
                          href={`https://wa.me/91${sanitizedPhone.slice(-10)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs text-center font-semibold px-3 py-1.5 rounded-lg"
                        >
                          WhatsApp
                        </a>
                      )}

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEditEnquiry(enq)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          स्थिती / टीप
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteEnquiry(enq.id)}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        हटवा
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEnquiries.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-10">या वर्गवारीत कोणतेही संदेश उपलब्ध नाहीत.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}