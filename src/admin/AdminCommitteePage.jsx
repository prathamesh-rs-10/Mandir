import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DEFAULT_CATEGORIES = [
  'कार्यकारी मंडळ',
  'सल्लागार समिती',
  'महिला मंडळ',
  'युवा विभाग',
  'विश्वस्त मंडळ'
];

export default function AdminCommitteePage({ showNotification }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('ALL');

  // Form state for new member
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [category, setCategory] = useState('कार्यकारी मंडळ');
  const [customCategory, setCustomCategory] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isVisible, setIsVisible] = useState(true);

  // Edit row state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    designation: '',
    category: '',
    display_order: 1,
    is_visible: true,
  });

  // Fetch committee list
  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mandir_committee')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      showNotification?.('डेटा लोड करताना त्रुटी आली: ' + error.message, 'error');
    } else {
      setMembers(data || []);
      // Auto-set the next display order for the add form
      if (data && data.length > 0) {
        const maxOrder = Math.max(...data.map((m) => m.display_order || 0));
        setDisplayOrder(maxOrder + 1);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. ADD MEMBER
  const handleAdd = async (e) => {
    e.preventDefault();
    const finalCategory = category === 'CUSTOM' ? customCategory.trim() : category;

    if (!finalCategory) {
      showNotification?.('कृपया वैध विभाग/कॅटेगरी निवडा किंवा लिहा.', 'error');
      return;
    }

    const newMember = {
      full_name: fullName.trim(),
      designation: designation.trim(),
      category: finalCategory,
      display_order: Number(displayOrder) || 1,
      is_visible: isVisible,
    };

    const { error } = await supabase.from('mandir_committee').insert([newMember]);

    if (!error) {
      setFullName('');
      setDesignation('');
      setCustomCategory('');
      setCategory('कार्यकारी मंडळ');
      loadData();
      showNotification?.('सदस्य यशस्वीरित्या जोडले!');
    } else {
      showNotification?.('त्रुटी: ' + error.message, 'error');
    }
  };

  // 2. TOGGLE VISIBILITY (Quick action)
  const handleToggleVisibility = async (id, currentStatus) => {
    const updatedStatus = !currentStatus;
    const { error } = await supabase
      .from('mandir_committee')
      .update({ is_visible: updatedStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_visible: updatedStatus } : m))
      );
      showNotification?.(updatedStatus ? 'सदस्य फ्रंटएंडवर दृश्यमान केला.' : 'सदस्य फ्रंटएंडवरून लपवला.');
    } else {
      showNotification?.('बदल जतन करण्यात त्रुटी: ' + error.message, 'error');
    }
  };

  // 3. EDIT ACTIONS
  const startEditing = (member) => {
    setEditingId(member.id);
    setEditForm({
      full_name: member.full_name,
      designation: member.designation,
      category: member.category,
      display_order: member.display_order ?? 1,
      is_visible: member.is_visible ?? true,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdate = async (id) => {
    if (!editForm.full_name.trim() || !editForm.designation.trim() || !editForm.category.trim()) {
      showNotification?.('कृपया सर्व आवश्यक माहिती भरा.', 'error');
      return;
    }

    const { error } = await supabase
      .from('mandir_committee')
      .update({
        full_name: editForm.full_name.trim(),
        designation: editForm.designation.trim(),
        category: editForm.category.trim(),
        display_order: Number(editForm.display_order) || 1,
        is_visible: editForm.is_visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      loadData();
      showNotification?.('नोंद यशस्वीरित्या अद्ययावत केली!');
    } else {
      showNotification?.('त्रुटी: ' + error.message, 'error');
    }
  };

  // 4. DELETE
  const handleDelete = async (id) => {
    if (!window.confirm('तुम्हाला नक्की या सदस्याची नोंद कायमची हटवायची आहे का?')) return;

    const { error } = await supabase.from('mandir_committee').delete().eq('id', id);
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      showNotification?.('सदस्य यशस्वीरित्या हटवला.');
    } else {
      showNotification?.('त्रुटी: ' + error.message, 'error');
    }
  };

  // Filter members list based on category selector
  const filteredMembers =
    selectedFilterCategory === 'ALL'
      ? members
      : members.filter((m) => m.category === selectedFilterCategory);

  // Collect unique categories for filter bar
  const allCategories = Array.from(new Set(members.map((m) => m.category))).filter(Boolean);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* ─── ADD NEW MEMBER FORM ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <h2 className="text-base font-bold text-gray-800 border-b pb-3 mb-4 flex items-center justify-between">
          <span>नवीन कमिटी सदस्य जोडा</span>
          <span className="text-xs font-normal text-gray-500">* सर्व रकाने भरणे आवश्यक</span>
        </h2>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">पूर्ण नाव *</label>
              <input
                type="text"
                placeholder="उदा. राजेश रमेश जोशी"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">पद / जबाबदारी *</label>
              <input
                type="text"
                placeholder="उदा. अध्यक्ष / सचिव / खजिनदार"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">विभाग / समिती *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="CUSTOM">+ इतर नवीन विभाग जोडा</option>
              </select>
            </div>

            {category === 'CUSTOM' && (
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">नवीन विभागाचे नाव *</label>
                <input
                  type="text"
                  placeholder="उदा. उत्सव समिती"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm bg-orange-50/30 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">क्रम (Display Order)</label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_visible_checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
              />
              <label htmlFor="is_visible_checkbox" className="text-xs font-medium text-gray-700 cursor-pointer">
                वेबसाइटवर लगेच दाखवा (Visible on frontend)
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors shadow-sm"
          >
            + सदस्य जोडा
          </button>
        </form>
      </div>

      {/* ─── MEMBER LIST & CONTROLS ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
          <div>
            <h3 className="font-bold text-gray-800 text-base">
              कमिटी सदस्य व्यवस्थापन ({members.length})
            </h3>
            <p className="text-xs text-gray-500">
              इथून तुम्ही माहिती बदलू शकता किंवा वेबसाइटवर काय दिसावे ते ठरवू शकता.
            </p>
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className="text-xs font-medium text-gray-600">विभाग फिल्टर:</span>
            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50"
            >
              <option value="ALL">सर्व विभाग ({members.length})</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c} ({members.filter((m) => m.category === c).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Member Items Table / Cards */}
        {loading ? (
          <p className="text-xs text-center text-gray-400 py-8">डेटा लोड होत आहे...</p>
        ) : filteredMembers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">कोणतेही सदस्य उपलब्ध नाहीत.</p>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((m) => {
              const isEditing = editingId === m.id;

              return (
                <div
                  key={m.id}
                  className={`p-4 border rounded-xl transition-all ${
                    !m.is_visible
                      ? 'bg-gray-50/70 border-dashed border-gray-300 opacity-80'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {isEditing ? (
                    /* ─── INLINE EDIT MODE ─── */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 font-semibold uppercase">नाव</label>
                          <input
                            type="text"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            className="w-full border rounded px-2.5 py-1.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500 font-semibold uppercase">पद</label>
                          <input
                            type="text"
                            value={editForm.designation}
                            onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                            className="w-full border rounded px-2.5 py-1.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500 font-semibold uppercase">विभाग / समिती</label>
                          <input
                            type="text"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full border rounded px-2.5 py-1.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-500 font-semibold uppercase">क्रम (Order)</label>
                          <input
                            type="number"
                            value={editForm.display_order}
                            onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value })}
                            className="w-full border rounded px-2.5 py-1.5 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.is_visible}
                            onChange={(e) => setEditForm({ ...editForm, is_visible: e.target.checked })}
                            className="rounded text-orange-600 h-4 w-4"
                          />
                          <span>वेबसाइटवर दाखवा (Visible)</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdate(m.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                          >
                            जतन करा (Save)
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          >
                            रद्द करा
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ─── DISPLAY MODE ─── */
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          #{m.display_order ?? '-'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{m.full_name}</p>
                            {!m.is_visible && (
                              <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                                लपवलेले (Hidden)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            <span className="font-medium text-gray-700">{m.designation}</span>
                            <span className="mx-2 text-gray-300">•</span>
                            <span className="text-orange-700 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                              {m.category}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Quick Visibility Toggle */}
                        <button
                          onClick={() => handleToggleVisibility(m.id, m.is_visible)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                            m.is_visible
                              ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {m.is_visible ? 'लपवा (Hide)' : 'दाखवा (Show)'}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => startEditing(m)}
                          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg font-medium"
                        >
                          संपादित करा
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-xs text-red-600 hover:text-red-800 border border-red-200 bg-red-50/50 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium"
                        >
                          हटवा
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}