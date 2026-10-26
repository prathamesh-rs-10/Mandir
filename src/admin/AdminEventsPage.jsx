import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

const EMPTY_MEDIA_FORM = {
  title: '',
  category: 'वास्तू आराखडा',
  media_type: 'image',
  media_url: '',
  event_date: '',
  description: '',
  is_featured: false,
};

export default function AdminGalleryPage({ showNotification }) {
  // Page configuration state
  const [config, setConfig] = useState({
    page_title: '',
    page_subtitle: '',
    upload_notice: '',
    allow_devotee_uploads: true,
  });

  // Gallery items and tabs
  const [gallery, setGallery] = useState([]);
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form & Editing state
  const [editingId, setEditingId] = useState(null);
  const [mediaForm, setMediaForm] = useState(EMPTY_MEDIA_FORM);
  const [uploadFile, setUploadFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Loading states
  const [fetching, setFetching] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notify = (msg, type = 'success') => {
    if (typeof showNotification === 'function') {
      showNotification(msg, type);
    } else {
      alert(msg);
    }
  };

  const loadData = async () => {
    const [configRes, galleryRes] = await Promise.all([
      supabase.from('mandir_gallery_config').select('*').limit(1).single(),
      supabase.from('mandir_gallery').select('*').order('created_at', { ascending: false }),
    ]);

    if (configRes.data) {
      setConfig({
        page_title: configRes.data.page_title ?? '',
        page_subtitle: configRes.data.page_subtitle ?? '',
        upload_notice: configRes.data.upload_notice ?? '',
        allow_devotee_uploads: configRes.data.allow_devotee_uploads ?? true,
      });
    }

    if (galleryRes.data) {
      setGallery(galleryRes.data);
    }

    setFetching(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute category list from database records
  const dynamicCategories = useMemo(() => {
    const set = new Set(['वास्तू आराखडा', 'मंदिर बांधकाम', 'दर्शन व उत्सव', 'महाप्रसाद व सेवा']);
    gallery.forEach((item) => {
      if (item.category?.trim()) set.add(item.category.trim());
    });
    return Array.from(set);
  }, [gallery]);

  // YouTube Helper
  const isYouTubeUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  // 1. Save Page Configuration & Devotee Permissions
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);

    const { error } = await supabase.from('mandir_gallery_config').upsert({
      id: 1,
      page_title: config.page_title,
      page_subtitle: config.page_subtitle,
      upload_notice: config.upload_notice,
      allow_devotee_uploads: config.allow_devotee_uploads,
      updated_at: new Date().toISOString(),
    });

    setSavingConfig(false);

    if (!error) {
      notify('गॅलरी पृष्ठ सेटिंग्ज यशस्वीरित्या जतन केल्या!');
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  // 2. Handle File Selection and Preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  // 3. Add or Update Gallery Media
  const handleSaveMedia = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalMediaUrl = mediaForm.media_url?.trim();

    // Upload file if new file chosen
    if (uploadFile) {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `admin_${mediaForm.media_type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `gallery-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('temple-assets')
        .upload(filePath, uploadFile);

      if (uploadError) {
        notify('फाईल अपलोड त्रुटी: ' + uploadError.message, 'error');
        setIsSubmitting(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('temple-assets')
        .getPublicUrl(filePath);

      finalMediaUrl = publicData.publicUrl;
    }

    if (!finalMediaUrl) {
      notify('कृपया फाईल निवडा किंवा वैध URL प्रविष्ट करा.', 'error');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: mediaForm.title,
      category: mediaForm.category || 'वास्तू आराखडा',
      media_type: mediaForm.media_type,
      media_url: finalMediaUrl,
      event_date: mediaForm.event_date,
      description: mediaForm.description,
      is_featured: mediaForm.is_featured,
      uploader_name: editingId ? undefined : 'व्यवस्थापक (Admin)',
      is_approved: true, // Admin additions are approved by default
    };

    let result;
    if (editingId) {
      result = await supabase.from('mandir_gallery').update(payload).eq('id', editingId);
    } else {
      result = await supabase.from('mandir_gallery').insert([payload]);
    }

    setIsSubmitting(false);

    if (!result.error) {
      notify(editingId ? 'नोंद यशस्वीरित्या अद्ययावत केली!' : 'नवीन फोटो/व्हिडिओ गॅलरीत जोडला गेला!');
      handleCancelEdit();
      loadData();
    } else {
      notify('त्रुटी: ' + result.error.message, 'error');
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setMediaForm({
      title: item.title ?? '',
      category: item.category ?? 'वास्तू आराखडा',
      media_type: item.media_type ?? 'image',
      media_url: item.media_url ?? '',
      event_date: item.event_date ?? '',
      description: item.description ?? '',
      is_featured: item.is_featured ?? false,
    });
    setUploadFile(null);
    setFilePreview(item.media_type === 'image' ? item.media_url : null);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMediaForm(EMPTY_MEDIA_FORM);
    setUploadFile(null);
    setFilePreview(null);
  };

  // Toggle Live Approval
  const toggleApproval = async (id, currentStatus) => {
    const { error } = await supabase
      .from('mandir_gallery')
      .update({ is_approved: !currentStatus })
      .eq('id', id);

    if (!error) {
      notify(!currentStatus ? 'नोंद गॅलरीत प्रकाशित केली!' : 'नोंद गॅलरीतून लपवली.');
      loadData();
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  // Toggle Featured Flag
  const toggleFeatured = async (id, currentFeatured) => {
    const { error } = await supabase
      .from('mandir_gallery')
      .update({ is_featured: !currentFeatured })
      .eq('id', id);

    if (!error) {
      notify(!currentFeatured ? 'विशेष (Featured) म्हणून चिन्हांकित केले!' : 'विशेष यादीतून काढले.');
      loadData();
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  // Delete Media
  const handleDelete = async (id) => {
    if (!window.confirm('ही नोंद कायमस्वरूपी हटवायची आहे का?')) return;
    const { error } = await supabase.from('mandir_gallery').delete().eq('id', id);

    if (!error) {
      notify('नोंद यशस्वीरित्या हटवली.');
      loadData();
      if (editingId === id) handleCancelEdit();
    } else {
      notify('त्रुटी: ' + error.message, 'error');
    }
  };

  // Filtered lists
  const approvedList = useMemo(() => {
    return gallery.filter((item) => {
      if (!item.is_approved) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.uploader_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [gallery, selectedCategory, searchQuery]);

  const pendingList = useMemo(() => {
    return gallery.filter((item) => !item.is_approved);
  }, [gallery]);

  if (fetching) {
    return <div className="p-8 text-center text-stone-500 font-medium">डेटा लोड करत आहे...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 font-sans text-stone-800">
      
      {/* Top Header */}
      <div className="border-b border-stone-200 pb-3">
        <h2 className="text-xl font-bold text-stone-900">गॅलरी व्यवस्थापन (Gallery CMS & Moderation)</h2>
        <p className="text-xs text-stone-500 mt-1">
          वेबसाईटवरील फोटो, व्हिडिओ, भाविक अपलोड्सची पडताळणी आणि पृष्ठ सेटिंग्ज येथून नियंत्रित करा.
        </p>
      </div>

      {/* 1. Page Configuration & Settings Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-orange-800 border-b pb-2 flex items-center gap-2">
          ⚙️ १. गॅलरी पृष्ठ शीर्षक व भाविक अपलोड सेटिंग्ज
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
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
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
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                भाविक अपलोड सूचना संदेश (Upload Notice)
              </label>
              <input
                type="text"
                value={config.upload_notice}
                onChange={(e) => setConfig({ ...config, upload_notice: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="allow_devotee_uploads"
                checked={config.allow_devotee_uploads}
                onChange={(e) => setConfig({ ...config, allow_devotee_uploads: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-400 h-4 w-4"
              />
              <label htmlFor="allow_devotee_uploads" className="text-xs font-semibold text-stone-800 cursor-pointer">
                भाविकांना वेबसाईटवरून फोटो/व्हिडिओ पाठवण्याची परवानगी द्या (Allow Devotee Uploads)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingConfig}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-sm"
          >
            {savingConfig ? 'जतन करत आहे...' : 'सेटिंग्ज सेव्ह करा'}
          </button>
        </form>
      </div>

      {/* 2. Media Add / Edit Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-base font-bold text-orange-800 flex items-center gap-2">
            <span>{editingId ? '✏️' : '➕'}</span>
            <span>
              {editingId ? '२. छायाचित्र / व्हिडिओ संपादित करा (Edit Media)' : '२. नवीन छायाचित्र किंवा व्हिडिओ जोडा (Admin Direct Upload)'}
            </span>
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-stone-500 hover:text-stone-800 underline font-medium"
            >
              संपादित करणे रद्द करा
            </button>
          )}
        </div>

        <form onSubmit={handleSaveMedia} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                शीर्षक / कॅप्शन *
              </label>
              <input
                type="text"
                placeholder="उदा. शिखर व कळस रचना"
                value={mediaForm.title}
                onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">विभाग (Category)</label>
              <input
                type="text"
                list="adminCategoryList"
                placeholder="उदा. वास्तू आराखडा"
                value={mediaForm.category}
                onChange={(e) => setMediaForm({ ...mediaForm, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
              <datalist id="adminCategoryList">
                {dynamicCategories.map((cat, idx) => (
                  <option key={idx} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">माध्यम प्रकार</label>
              <select
                value={mediaForm.media_type}
                onChange={(e) => setMediaForm({ ...mediaForm, media_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="image">🖼️ छायाचित्र (Photo)</option>
                <option value="video">🎥 व्हिडिओ (Video)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">तारीख / वर्ष</label>
              <input
                type="text"
                placeholder="उदा. ऑक्टोबर २०२४"
                value={mediaForm.event_date}
                onChange={(e) => setMediaForm({ ...mediaForm, event_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_featured"
                checked={mediaForm.is_featured}
                onChange={(e) => setMediaForm({ ...mediaForm, is_featured: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-400 h-4 w-4"
              />
              <label htmlFor="is_featured" className="text-xs font-semibold text-stone-800 cursor-pointer">
                ⭐ विशेष बॅज द्या (Featured Item)
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                सविस्तर माहिती / वर्णन (Description)
              </label>
              <textarea
                rows="2"
                placeholder="या फोटो किंवा व्हिडिओविषयी अधिक माहिती..."
                value={mediaForm.description}
                onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>

            {/* Direct Upload File */}
            <div className="md:col-span-2 border border-dashed border-stone-300 rounded-xl p-3 bg-stone-50/50">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                थेट संगणकातून फाईल निवडा ({mediaForm.media_type === 'image' ? 'JPG, PNG, WebP' : 'MP4, WebM'})
              </label>
              <input
                type="file"
                accept={mediaForm.media_type === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="text-xs text-stone-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-100 file:text-orange-800 hover:file:bg-orange-200 cursor-pointer"
              />
              {filePreview && (
                <div className="mt-2 w-24 h-20 rounded-lg overflow-hidden border border-stone-200">
                  <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Direct Web URL */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                किंवा ऑनलाइन URL / YouTube लिंक
              </label>
              <input
                type="url"
                placeholder="https://... किंवा YouTube"
                value={mediaForm.media_url}
                onChange={(e) => setMediaForm({ ...mediaForm, media_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition"
            >
              {isSubmitting
                ? 'अपलोड होत आहे...'
                : editingId
                ? 'बदल जतन करा (Update Media)'
                : 'गॅलरीत प्रकाशित करा (Publish)'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition"
              >
                रद्द करा
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Moderation & Gallery Management Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-200 pb-3 gap-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                activeTab === 'approved'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              वेबसाईटवर प्रदर्शित संग्रह ({approvedList.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>पडताळणी प्रलंबित (Pending)</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  pendingList.length > 0 ? 'bg-amber-400 text-stone-900' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {pendingList.length}
              </span>
            </button>
          </div>

          {/* Search bar inside Approved list */}
          {activeTab === 'approved' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="शीर्षक किंवा नावाने शोधा..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 w-full sm:w-60"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
              >
                <option value="all">सर्व विभाग</option>
                {dynamicCategories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Pending Moderation List */}
        {activeTab === 'pending' ? (
          <div className="space-y-4">
            {pendingList.map((item) => (
              <div
                key={item.id}
                className="p-5 border border-amber-200 bg-amber-50/40 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-28 h-24 bg-black rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-amber-300">
                    {item.media_type === 'video' ? (
                      isYouTubeUrl(item.media_url) ? (
                        <iframe src={getEmbedUrl(item.media_url)} title={item.title} className="w-full h-full" />
                      ) : (
                        <video src={item.media_url} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full border border-orange-200">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500">
                        {item.media_type === 'video' ? '🎥 व्हिडिओ' : '🖼️ फोटो'}
                      </span>
                      {item.event_date && (
                        <span className="text-[11px] text-stone-400">🗓️ {item.event_date}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-stone-900 text-base">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-stone-600 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-xs text-stone-500 pt-1">
                      पाठवणारे: <strong className="text-stone-800">{item.uploader_name}</strong>{' '}
                      {item.uploader_phone && `(${item.uploader_phone})`} •{' '}
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('mr-IN') : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => toggleApproval(item.id, false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition"
                  >
                    मंजूर करा (Approve) ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditClick(item)}
                    className="border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl transition"
                  >
                    संपादित करा
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:bg-red-50 text-xs font-bold border border-red-200 px-3 py-2 rounded-xl transition"
                  >
                    हटवा
                  </button>
                </div>
              </div>
            ))}

            {pendingList.length === 0 && (
              <div className="text-center py-12 text-stone-400 border border-dashed rounded-2xl">
                कोणतीही नवीन नोंद मंजुरीसाठी प्रलंबित नाही. सर्व नोंदी तपासल्या गेल्या आहेत.
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Approved / Live Media Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {approvedList.map((item) => (
              <div
                key={item.id}
                className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="relative w-full h-44 bg-black flex items-center justify-center overflow-hidden">
                  {item.media_type === 'video' ? (
                    isYouTubeUrl(item.media_url) ? (
                      <iframe src={getEmbedUrl(item.media_url)} title={item.title} className="w-full h-full" />
                    ) : (
                      <video src={item.media_url} controls className="w-full h-full object-cover" />
                    )
                  ) : (
                    <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                  )}

                  <div className="absolute top-2 inset-x-2 flex justify-between items-center pointer-events-none">
                    <span className="text-[10px] bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full font-bold">
                      {item.category}
                    </span>
                    {item.is_featured && (
                      <span className="text-[10px] bg-orange-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow">
                        विशेष ⭐
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-stone-900 text-sm leading-snug line-clamp-1" title={item.title}>
                      {item.title}
                    </h4>
                  </div>
                  {item.description && (
                    <p className="text-xs text-stone-500 line-clamp-1">{item.description}</p>
                  )}
                  <p className="text-[11px] text-stone-400">
                    सौजन्य: {item.uploader_name || 'व्यवस्थापक'} {item.event_date ? `• ${item.event_date}` : ''}
                  </p>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-stone-100 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(item.id, item.is_featured)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        item.is_featured
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {item.is_featured ? 'विशेष काढवा' : 'विशेष करा ⭐'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        className="text-stone-700 hover:bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        संपादित
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleApproval(item.id, true)}
                        className="text-amber-800 hover:bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        लपवा
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:bg-red-50 border border-red-200 px-2 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        हटवा
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {approvedList.length === 0 && (
              <div className="col-span-full text-center py-12 text-stone-400 border border-dashed rounded-2xl">
                वेबसाईटवर प्रदर्शित करण्यासाठी कोणतीही सामग्री उपलब्ध नाही.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}