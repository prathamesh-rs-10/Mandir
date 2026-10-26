import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Seva / Volunteer Modal State
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerCity, setVolunteerCity] = useState('');
  const [sevaType, setSevaType] = useState('अन्नदान व महाप्रसाद वाटप');
  const [volunteerMsg, setVolunteerMsg] = useState('');
  const [submittingSeva, setSubmittingSeva] = useState(false);
  const [sevaSuccess, setSevaSuccess] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadEvents = async () => {
    const { data } = await supabase
      .from('mandir_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (data && data.length > 0) {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    setSubmittingSeva(true);

    const { error } = await supabase.from('mandir_event_volunteers').insert([
      {
        event_id: activeModalEvent.id,
        event_title: activeModalEvent.title,
        volunteer_name: volunteerName,
        phone: volunteerPhone,
        city: volunteerCity || 'शेरपे',
        seva_type: sevaType,
        message: volunteerMsg,
      },
    ]);

    setSubmittingSeva(false);
    if (!error) {
      setSevaSuccess(true);
      setTimeout(() => {
        setSevaSuccess(false);
        setActiveModalEvent(null);
        setVolunteerName('');
        setVolunteerPhone('');
        setVolunteerCity('');
        setVolunteerMsg('');
      }, 2500);
    } else {
      showToast('नोंदणी करताना त्रुटी आली.');
    }
  };

  const categories = [
    { id: 'ALL', label: 'सर्व कार्यक्रम (All)' },
    { id: 'वार्षिक उत्सव', label: 'वार्षिक उत्सव (Festivals)' },
    { id: 'धार्मिक विधी', label: 'धार्मिक विधी व कीर्तन (Rituals)' },
    { id: 'विशेष सोहळा', label: 'विशेष सोहळे (Ceremonies)' },
    { id: 'बैठक व सभा', label: 'बैठका व सभा (Meetings)' },
  ];

  const filteredEvents = events.filter(
    (ev) => selectedCategory === 'ALL' || ev.event_category === selectedCategory
  );

  const featuredEvent = events.find((ev) => ev.is_featured && ev.status !== 'संपन्न') || events[0];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold">
          ✓ {toastMessage}
        </div>
      )}

      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
          ॥ सण, उत्सव व सेवा सोहळे ॥
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-950 mt-2">
          उत्सव व धार्मिक कार्यक्रम
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-2">
          श्री काळंबादेवी मंदिरातील आगामी धार्मिक विधी, वार्षिक जत्रोत्सव, पालखी मिरवणूक व बैठकांची सविस्तर माहिती.
        </p>
      </div>

      {/* ================= FEATURED MEGA BANNER ================= */}
      {featuredEvent && (
        <div className="bg-gradient-to-br from-orange-900 via-orange-800 to-amber-900 text-white rounded-3xl overflow-hidden shadow-xl mb-12 border border-orange-700/50">
          <div className="grid lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-400 text-orange-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  ⭐ प्रमुख आगामी उत्सव
                </span>
                <span className="bg-orange-700/80 text-orange-100 text-xs px-2.5 py-0.5 rounded-full border border-orange-500">
                  {featuredEvent.event_category}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
                {featuredEvent.title}
              </h2>
              
              {featuredEvent.subtitle && (
                <p className="text-orange-200 text-sm sm:text-base font-medium">
                  {featuredEvent.subtitle}
                </p>
              )}

              <p className="text-orange-100/90 text-xs sm:text-sm leading-relaxed line-clamp-3">
                {featuredEvent.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs border-t border-orange-700/60">
                <div>
                  <p className="text-orange-300 font-semibold">तारीख</p>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {featuredEvent.event_date} {featuredEvent.end_date ? `ते ${featuredEvent.end_date}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-orange-300 font-semibold">वेळ</p>
                  <p className="font-bold text-white text-sm mt-0.5">{featuredEvent.event_time || 'दिवसभर'}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-orange-300 font-semibold">स्थान</p>
                  <p className="font-bold text-white text-sm mt-0.5 truncate">{featuredEvent.location}</p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModalEvent(featuredEvent)}
                  className="bg-amber-400 hover:bg-amber-300 text-orange-950 font-extrabold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition"
                >
                  🙏 सेवेसाठी नाव नोंदवा (Volunteer / Seva)
                </button>
                {featuredEvent.contact_phone && (
                  <a
                    href={`tel:${featuredEvent.contact_phone.replace(/[^0-9+]/g, '')}`}
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-3 rounded-xl text-xs sm:text-sm border border-white/20 transition flex items-center gap-1.5"
                  >
                    <span>📞</span>
                    <span>संपर्क: {featuredEvent.contact_person || 'संयोजक'}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 h-64 lg:h-full min-h-[300px] relative overflow-hidden">
              <img
                src={featuredEvent.banner_url || 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1000&q=80'}
                alt={featuredEvent.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-950 via-transparent to-transparent lg:hidden"></div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CATEGORY FILTER TABS ================= */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
              selectedCategory === cat.id
                ? 'bg-orange-700 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-orange-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ================= EVENTS DIRECTORY ================= */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">कार्यक्रम लोड होत आहेत...</div>
      ) : (
        <div className="space-y-8">
          {filteredEvents.map((ev) => {
            const isCompleted = ev.status === 'संपन्न';

            return (
              <div
                key={ev.id}
                className={`bg-white rounded-3xl border border-orange-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col md:flex-row ${
                  isCompleted ? 'opacity-75 bg-gray-50/50' : ''
                }`}
              >
                {/* Date & Thumbnail Column */}
                <div className="md:w-72 bg-gradient-to-b from-orange-50 to-orange-100/60 p-6 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-orange-200">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold uppercase bg-orange-600 text-white px-2.5 py-0.5 rounded-full">
                        {ev.event_category}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-gray-200 text-gray-700 border-gray-300'
                            : 'bg-green-100 text-green-800 border-green-300'
                        }`}
                      >
                        {ev.status || 'आगामी'}
                      </span>
                    </div>

                    <div className="text-center py-2">
                      <p className="text-xs text-orange-800 uppercase font-bold tracking-wider">उत्सव तारीख</p>
                      <p className="text-2xl sm:text-3xl font-black text-orange-950 mt-1">
                        {new Date(ev.event_date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-gray-600 font-semibold mt-0.5">
                        {new Date(ev.event_date).getFullYear()}
                        {ev.end_date && ` (अखेर ${new Date(ev.end_date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short' })})`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-orange-200/80 text-xs text-gray-600 space-y-1">
                    <p className="flex items-center gap-1.5 font-medium">
                      <span>⏰</span>
                      <span>{ev.event_time || 'वेळ जाहीर होईल'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-medium truncate" title={ev.location}>
                      <span>📍</span>
                      <span>{ev.location}</span>
                    </p>
                  </div>
                </div>

                {/* Event Details Content */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                      {ev.title}
                    </h3>
                    
                    {ev.subtitle && (
                      <p className="text-xs sm:text-sm font-semibold text-orange-700 mt-1">
                        {ev.subtitle}
                      </p>
                    )}

                    <p className="text-gray-600 text-xs sm:text-sm mt-3 leading-relaxed">
                      {ev.description}
                    </p>

                    {/* Attractions & Highlights */}
                    {ev.attractions && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {ev.attractions.split(',').map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg"
                          >
                            🚩 {item.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Schedule Outline */}
                    {ev.schedule_details && (
                      <div className="mt-4 p-3.5 bg-orange-50/50 rounded-xl border border-orange-100 text-xs">
                        <p className="font-bold text-orange-950 mb-1">दैनंदिन रूपरेषा व कार्यक्रम:</p>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{ev.schedule_details}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Coordinator */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-gray-600">
                      {ev.contact_person && (
                        <span>
                          संयोजक: <strong>{ev.contact_person}</strong>
                          {ev.contact_phone && (
                            <a
                              href={`tel:${ev.contact_phone.replace(/[^0-9+]/g, '')}`}
                              className="text-orange-700 font-bold ml-1 hover:underline"
                            >
                              ({ev.contact_phone})
                            </a>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => setActiveModalEvent(ev)}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
                        >
                          सेवा सहभाग नोंदवा (Volunteer)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const shareText = `॥ श्री काळंबादेवी मंदिर उत्सव ॥\n${ev.title}\nतारीख: ${ev.event_date}\nस्थान: ${ev.location}`;
                          navigator.clipboard.writeText(shareText);
                          showToast('कार्यक्रमाची माहिती कॉपी झाली!');
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
                      >
                        शेअर माहिती
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 text-sm">
              या प्रकारात सध्या कोणतेही कार्यक्रम उपलब्ध नाहीत.
            </div>
          )}
        </div>
      )}

      {/* ================= VOLUNTEER / SEVA REGISTRATION MODAL ================= */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-orange-200">
            <button
              onClick={() => setActiveModalEvent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                स्वयंसेवक सेवा नोंदणी
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">
                {activeModalEvent.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                या उत्सवात निष्काम सेवेसाठी आपले नाव व संपर्क नोंदवा. कमिटीचे प्रतिनिधी आपल्याशी संपर्क करतील.
              </p>
            </div>

            {sevaSuccess ? (
              <div className="bg-green-50 border border-green-300 text-green-800 p-6 rounded-2xl text-center space-y-2">
                <span className="text-3xl">🙏</span>
                <h4 className="font-bold text-base">आपली सेवा नोंदणी यशस्वी झाली!</h4>
                <p className="text-xs text-green-700">
                  आई काळंबादेवी आपल्या सेवेचा स्वीकार करो. कमिटी लवकरच आपल्याशी समन्वय साधेल.
                </p>
              </div>
            ) : (
              <form onSubmit={handleVolunteerSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    आपले पूर्ण नाव (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. राहुल शांताराम सावंत"
                    value={volunteerName}
                    onChange={(e) => setVolunteerName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      मोबाईल क्रमांक (Mobile) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="98XXXXXXXX"
                      value={volunteerPhone}
                      onChange={(e) => setVolunteerPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      गाव / शहर (City)
                    </label>
                    <input
                      type="text"
                      placeholder="शेरपे / मुंबई"
                      value={volunteerCity}
                      onChange={(e) => setVolunteerCity(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    इच्छुक सेवा प्रकार (Preferred Seva)
                  </label>
                  <select
                    value={sevaType}
                    onChange={(e) => setSevaType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                  >
                    <option value="अन्नदान व महाप्रसाद वाटप">अन्नदान व महाप्रसाद वाटप</option>
                    <option value="दर्शन रांग व गर्दी नियंत्रण">दर्शन रांग व गर्दी नियंत्रण</option>
                    <option value="मंडप, सजावट व दीपमाळ सेवा">मंडप, सजावट व दीपमाळ सेवा</option>
                    <option value="वाहनतळ व स्वागत व्यवस्था">वाहनतळ व स्वागत व्यवस्था</option>
                    <option value="स्वच्छता व परिसर सेवा">स्वच्छता व परिसर सेवा</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    काही संदेश किंवा वेळ उपलब्धता (Optional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="उदा. संपूर्ण दिवस उपलब्ध किंवा सायंकाळी ५ नंतर..."
                    value={volunteerMsg}
                    onChange={(e) => setVolunteerMsg(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingSeva}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl shadow-md transition disabled:opacity-50 text-xs"
                >
                  {submittingSeva ? 'नोंदणी करत आहे...' : 'सेवा नोंदणी निश्चित करा (Submit Seva)'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}