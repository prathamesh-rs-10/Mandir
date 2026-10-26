import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function CommitteePage() {
  const [members, setMembers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('mandir_committee')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMembers(data);
        }
        setLoading(false);
      });
  }, []);

  const categories = [
    { id: 'ALL', label: 'सर्व सदस्य (All)' },
    { id: 'कार्यकारी मंडळ', label: 'कार्यकारी मंडळ (Executive)' },
    { id: 'सल्लागार समिती', label: 'सल्लागार समिती (Advisory)' },
    { id: 'महिला मंडळ', label: 'महिला मंडळ (Women Wing)' },
    { id: 'युवा विभाग', label: 'युवा विभाग (Youth Wing)' },
  ];

  const filteredMembers = members.filter(
    (m) => selectedCategory === 'ALL' || m.category === selectedCategory
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 font-sans">
      
      {/* Title & Trust Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
          ॥ निष्काम सेवा • पारदर्शक व्यवस्थापन ॥
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-950 mt-2">
          व्यवस्थापक व जीर्णोद्धार कमिटी
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-2">
          <strong>श्री काळंबादेवी मंडळ (रजिस्टर)</strong> व <strong>मंदिर जीर्णोद्धार कमिटी, शेरपे, मुंबई</strong> चे अधिकृत पदाधिकारी व विश्वस्त मंडळ.
        </p>
      </div>

      {/* Trust Values & Governance Charter Banner */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10 text-center">
        <div className="bg-white border border-orange-200 p-4 rounded-xl shadow-xs">
          <span className="text-2xl">🏛️</span>
          <h4 className="font-bold text-gray-800 text-sm mt-1">अधिकृत नोंदणीकृत मंडळ</h4>
          <p className="text-xs text-gray-500 mt-0.5">नियमांनुसार चालणारे सार्वजनिक धार्मिक देवस्थान</p>
        </div>
        <div className="bg-white border border-orange-200 p-4 rounded-xl shadow-xs">
          <span className="text-2xl">⚖️</span>
          <h4 className="font-bold text-gray-800 text-sm mt-1">पारदर्शक हिशोब व ऑडिट</h4>
          <p className="text-xs text-gray-500 mt-0.5">सर्व देणग्या आणि खर्चाचे वेळोवेळी जाहीर ऑडिट</p>
        </div>
        <div className="bg-white border border-orange-200 p-4 rounded-xl shadow-xs">
          <span className="text-2xl">🤝</span>
          <h4 className="font-bold text-gray-800 text-sm mt-1">ग्रामस्थ व भाविकांचा सहभाग</h4>
          <p className="text-xs text-gray-500 mt-0.5">सर्व समाज घटकांना सोबत घेऊन मंदिर विकास</p>
        </div>
      </div>

      {/* Category Filter Tabs */}
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

      {/* Members Directory */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">कमिटी माहिती लोड होत आहे...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const isTopExecutive = member.display_order <= 3;

            return (
              <div
                key={member.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                  isTopExecutive ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-start gap-4">
                    <img
                      src={member.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                      alt={member.full_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shrink-0 shadow-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full inline-block">
                        {member.category || 'कार्यकारी मंडळ'}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight mt-1 truncate" title={member.full_name}>
                        {member.full_name}
                      </h3>
                      <p className="text-xs font-semibold text-orange-700 mt-0.5">
                        {member.designation}
                      </p>
                    </div>
                  </div>

                  {/* Core Responsibilities */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">मुख्य कार्यभार / जबाबदारी</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {member.role_responsibility || 'मंदिराच्या जीर्णोद्धार आणि व्यवस्थापन कार्यात सक्रिय सहभाग.'}
                    </p>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  {member.phone ? (
                    <a
                      href={`tel:${member.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1.5 text-orange-700 font-semibold hover:text-orange-900"
                    >
                      <span>📞</span>
                      <span>{member.phone}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400">संपर्क: मंडळ कार्यालय</span>
                  )}

                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-gray-400 hover:text-orange-700 transition"
                      title={member.email}
                    >
                      ✉️ ईमेल
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Devotee Assistance Notice */}
      <div className="mt-14 bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center max-w-3xl mx-auto">
        <h4 className="font-bold text-orange-950 text-base mb-1">
          कमिटीशी प्रत्यक्ष भेट किंवा अधिक माहितीसाठी
        </h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          आपल्याला मंदिराच्या जीर्णोद्धाराबाबत काही विधायक सूचना करायच्या असल्यास किंवा वस्तूरूपाने देणगी द्यायची असल्यास आपण थेट वरील पदाधिकाऱ्यांशी अथवा मंडळ कार्यालयाशी संपर्क साधू शकता.
        </p>
      </div>
    </div>
  );
}