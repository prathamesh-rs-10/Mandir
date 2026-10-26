import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';

export default function GalleryPage() {
  const [config, setConfig] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'image' | 'video'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox Modal State
  const [activeMedia, setActiveMedia] = useState(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderPhone, setUploaderPhone] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  useEffect(() => {
    async function loadGalleryData() {
      const [configRes, mediaRes] = await Promise.all([
        supabase.from('mandir_gallery_config').select('*').limit(1).single(),
        supabase
          .from('mandir_gallery')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false }),
      ]);

      if (configRes.data) setConfig(configRes.data);
      if (mediaRes.data) setMediaList(mediaRes.data);
      setLoading(false);
    }

    loadGalleryData();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    mediaList.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [mediaList]);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      if (activeTab !== 'all' && item.media_type !== activeTab) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesUploader = item.uploader_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesUploader) return false;
      }
      return true;
    });
  }, [mediaList, activeTab, selectedCategory, searchQuery]);

  const isYouTubeUrl = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  };

  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    let videoId = null;
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `mandir-media-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

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

  const handleDevoteeSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadFeedback(null);

    let finalMediaUrl = mediaUrlInput.trim();

    if (uploadFile) {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${mediaType}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `gallery-uploads/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('temple-assets')
        .upload(filePath, uploadFile);

      if (storageError) {
        setUploadFeedback({ type: 'error', message: 'अपलोड त्रुटी: ' + storageError.message });
        setUploading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('temple-assets')
        .getPublicUrl(filePath);

      finalMediaUrl = publicData.publicUrl;
    }

    if (!finalMediaUrl) {
      setUploadFeedback({ type: 'error', message: 'कृपया फाईल निवडा किंवा वैध लिंक प्रविष्ट करा.' });
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('mandir_gallery').insert([
      {
        title,
        category: category || 'दर्शन व उत्सव',
        media_type: mediaType,
        media_url: finalMediaUrl,
        uploader_name: uploaderName || 'भाविक',
        uploader_phone: uploaderPhone,
        event_date: eventDate,
        description,
        is_approved: false,
      },
    ]);

    setUploading(false);

    if (!dbError) {
      setUploadFeedback({
        type: 'success',
        message: 'तुमचे छायाचित्र/व्हिडिओ पाठवण्यात आले आहे! कमिटीच्या मंजुरीनंतर ते गॅलरीत दिसेल.',
      });
      setTitle('');
      setUploaderName('');
      setUploaderPhone('');
      setEventDate('');
      setDescription('');
      setMediaUrlInput('');
      setUploadFile(null);
      setFilePreview(null);
    } else {
      setUploadFeedback({ type: 'error', message: 'त्रुटी: ' + dbError.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 font-sans antialiased py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Dynamic Header */}
        <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              {config?.page_title && (
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-amber-50 drop-shadow">
                  {config.page_title}
                </h1>
              )}
              {config?.page_subtitle && (
                <p className="text-orange-100 text-sm sm:text-base leading-relaxed font-medium">
                  {config.page_subtitle}
                </p>
              )}
            </div>

            {config?.allow_devotee_uploads && (
              <button
                onClick={() => {
                  setShowUploadModal(true);
                  setUploadFeedback(null);
                }}
                className="bg-white hover:bg-amber-50 text-orange-950 font-extrabold px-6 py-3.5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 shrink-0"
              >
                <span className="text-lg">📸</span>
                <span>फोटो / व्हिडिओ पाठवा</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="inline-flex bg-stone-100 p-1 rounded-xl overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                सर्व ({mediaList.length})
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  activeTab === 'image'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🖼️ फोटो ({mediaList.filter((m) => m.media_type === 'image').length})
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  activeTab === 'video'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🎥 व्हिडिओ ({mediaList.filter((m) => m.media_type === 'video').length})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-stone-400 pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="शीर्षक किंवा कॅप्शनने शोधा..."
                className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none bg-stone-50/70"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-400 mr-1">विभाग:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                  selectedCategory === 'all'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                सर्व
              </button>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                    selectedCategory === cat
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modern Bento/Visual-First Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[280px]">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-stone-200/70 rounded-3xl animate-pulse overflow-hidden relative"
              />
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-16 text-center space-y-3">
            <span className="text-5xl block">🖼️</span>
            <h3 className="text-lg font-bold text-stone-700">कोणतीही छायाचित्रे किंवा व्हिडिओ आढळले नाहीत</h3>
            <p className="text-xs sm:text-sm text-stone-500">वेगळे शोध शब्द निवडा किंवा फिल्टर बदला.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px] md:auto-rows-[320px]">
            {filteredMedia.map((item) => {
              const isVid = item.media_type === 'video';
              const isYT = isVid && isYouTubeUrl(item.media_url);
              const ytThumbnail = isYT ? getYouTubeThumbnail(item.media_url) : null;
              const isHero = Boolean(item.is_featured);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveMedia(item)}
                  className={`group relative rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-orange-950/20 transition-all duration-500 transform hover:-translate-y-1 bg-stone-900 border border-stone-200/30 ${
                    isHero ? 'sm:col-span-2 sm:row-span-2' : ''
                  }`}
                >
                  {/* Background Media Item */}
                  {isVid ? (
                    ytThumbnail ? (
                      <img
                        src={ytThumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-stone-400">
                        <span className="text-5xl opacity-40">🎥</span>
                      </div>
                    )
                  ) : (
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  )}

                  {/* Multi-stage Scrim Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 group-hover:via-black/40 transition-colors duration-300" />

                  {/* Top Badges */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 pointer-events-none z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.category && (
                        <span className="backdrop-blur-md bg-black/40 border border-white/20 text-amber-200 text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs">
                          {item.category}
                        </span>
                      )}
                      {item.is_featured && (
                        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md">
                          विशेष
                        </span>
                      )}
                    </div>

                    <span className="backdrop-blur-md bg-black/40 border border-white/10 text-white/90 text-[11px] font-medium px-2.5 py-1 rounded-full">
                      {isVid ? 'व्हिडिओ' : 'फोटो'}
                    </span>
                  </div>

                  {/* Centered Glowing Play Button for Videos */}
                  {isVid && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-orange-600 group-hover:border-orange-500 transition-all duration-300">
                        <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Bottom Sliding Info Drawer */}
                  <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-10 text-white flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {item.event_date && (
                      <span className="text-[11px] font-semibold text-amber-300/90 mb-1 flex items-center gap-1.5">
                        <span>🗓️</span> {item.event_date}
                      </span>
                    )}

                    <h3
                      className={`font-black text-white leading-snug drop-shadow-sm group-hover:text-amber-100 transition-colors line-clamp-2 ${
                        isHero ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                      }`}
                    >
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-stone-300 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-stone-300/90">
                      <span className="truncate max-w-[170px]">
                        सौजन्य: <strong className="text-white font-medium">{item.uploader_name || 'भाविक'}</strong>
                      </span>
                      <span className="text-amber-300 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        पाहा →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 1. Fullscreen Lightbox Modal */}
        {activeMedia && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto"
            onClick={() => setActiveMedia(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl my-8 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveMedia(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-lg font-bold transition shadow-lg"
              >
                ✕
              </button>

              <div className="w-full max-h-[65vh] bg-black flex items-center justify-center overflow-hidden">
                {activeMedia.media_type === 'video' ? (
                  isYouTubeUrl(activeMedia.media_url) ? (
                    <div className="w-full aspect-video">
                      <iframe
                        src={getEmbedUrl(activeMedia.media_url)}
                        title={activeMedia.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video
                      src={activeMedia.media_url}
                      controls
                      autoPlay
                      className="max-h-[65vh] w-full object-contain"
                    />
                  )
                ) : (
                  <img
                    src={activeMedia.media_url}
                    alt={activeMedia.title}
                    className="max-h-[65vh] w-auto max-w-full object-contain"
                  />
                )}
              </div>

              <div className="p-6 bg-stone-900 border-t border-stone-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {activeMedia.category && (
                        <span className="bg-orange-600/80 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                          {activeMedia.category}
                        </span>
                      )}
                      {activeMedia.event_date && (
                        <span className="text-stone-400 text-xs">
                          तारीख: {activeMedia.event_date}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white">{activeMedia.title}</h2>
                    {activeMedia.description && (
                      <p className="text-stone-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line pt-1">
                        {activeMedia.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {!isYouTubeUrl(activeMedia.media_url) ? (
                      <button
                        onClick={() =>
                          handleDownload(
                            activeMedia.media_url,
                            `${activeMedia.title}.${activeMedia.media_type === 'video' ? 'mp4' : 'jpg'}`
                          )
                        }
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                      >
                        <span>⬇️</span>
                        <span>डाउनलोड करा</span>
                      </button>
                    ) : (
                      <a
                        href={activeMedia.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                      >
                        <span>▶️</span>
                        <span>मूळ YouTube वर पहा</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-xs text-stone-500 pt-2 border-t border-stone-800 flex justify-between">
                  <span>छायाचित्र सौजन्य: {activeMedia.uploader_name || 'भाविक'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Devotee Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-stone-800">
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 text-xl font-bold transition"
              >
                ✕
              </button>

              <div className="space-y-1 mb-5">
                <h3 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
                  <span>📸</span>
                  <span>फोटो किंवा व्हिडिओ पाठवा</span>
                </h3>
                {config?.upload_notice && (
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {config.upload_notice}
                  </p>
                )}
              </div>

              {uploadFeedback && (
                <div
                  className={`p-3.5 rounded-xl mb-4 text-xs font-semibold ${
                    uploadFeedback.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {uploadFeedback.message}
                </div>
              )}

              <form onSubmit={handleDevoteeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">आपले नाव *</label>
                    <input
                      type="text"
                      required
                      value={uploaderName}
                      onChange={(e) => setUploaderName(e.target.value)}
                      placeholder="उदा. राहुल पाटील"
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">मोबाईल क्रमांक</label>
                    <input
                      type="tel"
                      value={uploaderPhone}
                      onChange={(e) => setUploaderPhone(e.target.value)}
                      placeholder="मोबाईल क्र."
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">प्रकार निवडा</label>
                    <select
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    >
                      <option value="image">🖼️ छायाचित्र (Photo)</option>
                      <option value="video">🎥 व्हिडिओ (Video)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">विभाग</label>
                    <input
                      type="text"
                      list="categorySuggestions"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="उदा. दर्शन व उत्सव"
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                    <datalist id="categorySuggestions">
                      {categories.map((c, i) => (
                        <option key={i} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">शीर्षक / कॅप्शन *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="उदा. नवरात्र उत्सव महाआरती"
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">तारीख / वर्ष</label>
                    <input
                      type="text"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      placeholder="उदा. ऑक्टोबर २०२४"
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">माहिती / वर्णन</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="थोडक्यात माहिती..."
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-2 border-dashed border-amber-300 bg-amber-50/40 rounded-2xl p-4 text-center space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    गॅलरी फाईल निवडा ({mediaType === 'image' ? 'JPG, PNG, WebP' : 'MP4, WebM'})
                  </label>
                  <input
                    type="file"
                    accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                    className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-600 file:text-white hover:file:bg-orange-700 cursor-pointer"
                  />
                  {filePreview && (
                    <div className="mt-2 w-28 h-28 mx-auto rounded-xl overflow-hidden border border-stone-300">
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  - किंवा ऑनलाइन लिंक द्या -
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    वेब URL किंवा YouTube व्हिडिओ लिंक
                  </label>
                  <input
                    type="url"
                    value={mediaUrlInput}
                    onChange={(e) => setMediaUrlInput(e.target.value)}
                    placeholder="https://images... किंवा https://youtu.be/..."
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2.5 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition"
                  >
                    {uploading ? 'अपलोड करत आहे...' : 'सादर करा'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}