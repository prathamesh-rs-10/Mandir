import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function DonationsPage() {
  const [donations, setDonations] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copyStatus, setCopyStatus] = useState('');

  // Devotee Donation Intimation Form State
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [devoteeForm, setDevoteeForm] = useState({
    donor_name: '',
    phone: '',
    city: '',
    amount: '',
    category: 'बांधकाम निधी',
    payment_mode: 'UPI',
    transaction_ref: '',
    message: '',
  });

  const loadData = async () => {
    // 1. Fetch donations
    const { data: donData } = await supabase
      .from('mandir_donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (donData) setDonations(donData);

    // 2. Fetch contact & bank info + QR code
    const { data: infoData } = await supabase
      .from('mandir_contact_info')
      .select('*')
      .limit(1)
      .single();

    if (infoData) setContactInfo(infoData);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Copy helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyStatus(`${label} कॉपी झाले!`);
    setTimeout(() => setCopyStatus(''), 3000);
  };

  // Submit offline / online transfer receipt request
  const handleDevoteeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('mandir_donations').insert([
      {
        donor_name: devoteeForm.donor_name,
        phone: devoteeForm.phone,
        city: devoteeForm.city || 'मुंबई',
        amount: parseFloat(devoteeForm.amount),
        category: devoteeForm.category,
        payment_mode: devoteeForm.payment_mode,
        transaction_ref: devoteeForm.transaction_ref,
        message: devoteeForm.message,
        is_verified: false,
      },
    ]);

    setSubmitting(false);
    if (!error) {
      setSubmittedSuccess(true);
      setDevoteeForm({
        donor_name: '',
        phone: '',
        city: '',
        amount: '',
        category: 'बांधकाम निधी',
        payment_mode: 'UPI',
        transaction_ref: '',
        message: '',
      });
      loadData();
    }
  };

  // Calculations
  const verifiedDonations = donations.filter((d) => d.is_verified);
  const totalAmount = verifiedDonations.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // Top 5 Donors ranked by amount
  const top5Donors = [...verifiedDonations]
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 5);

  // Filtered Donors for list
  const filteredDonors = verifiedDonations.filter((d) => {
    const matchesSearch =
      d.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.city && d.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Rank configurations
  const rankConfigs = [
    {
      badge: '🥇 १ ला मान',
      bg: 'from-amber-400 via-yellow-500 to-amber-600',
      textGradient: 'from-amber-600 to-yellow-600',
      ring: 'border-2 border-amber-400 ring-4 ring-amber-300/40',
      cardBg: 'bg-gradient-to-b from-amber-50 via-white to-orange-50/40',
      shadow: 'hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.45)]',
      glow: 'shadow-amber-400/50',
    },
    {
      badge: '🥈 २ रा मान',
      bg: 'from-slate-300 via-gray-400 to-slate-500',
      textGradient: 'from-slate-600 to-gray-600',
      ring: 'border border-slate-300 ring-2 ring-slate-200',
      cardBg: 'bg-gradient-to-b from-slate-50 via-white to-gray-50/40',
      shadow: 'hover:shadow-[0_20px_40px_-10px_rgba(148,163,184,0.45)]',
      glow: 'shadow-slate-400/40',
    },
    {
      badge: '🥉 ३ रा मान',
      bg: 'from-orange-400 via-amber-500 to-red-500',
      textGradient: 'from-orange-600 to-red-600',
      ring: 'border border-orange-300 ring-2 ring-orange-200',
      cardBg: 'bg-gradient-to-b from-orange-50 via-white to-amber-50/40',
      shadow: 'hover:shadow-[0_20px_40px_-10px_rgba(249,115,22,0.45)]',
      glow: 'shadow-orange-400/40',
    },
    {
      badge: '⭐ ४ था मान',
      bg: 'from-emerald-400 to-teal-600',
      textGradient: 'from-emerald-600 to-teal-600',
      ring: 'border border-emerald-200',
      cardBg: 'bg-gradient-to-b from-emerald-50/40 via-white to-teal-50/20',
      shadow: 'hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.35)]',
      glow: 'shadow-emerald-400/30',
    },
    {
      badge: '⭐ ५ वा मान',
      bg: 'from-blue-400 to-indigo-600',
      textGradient: 'from-blue-600 to-indigo-600',
      ring: 'border border-blue-200',
      cardBg: 'bg-gradient-to-b from-blue-50/40 via-white to-indigo-50/20',
      shadow: 'hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.35)]',
      glow: 'shadow-blue-400/30',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 font-sans">
      {/* Self-contained CSS for smooth infinite horizontal floating animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes marqueeScroll {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-horizontal-float {
              display: flex;
              width: max-content;
              animation: marqueeScroll 28s linear infinite;
            }
            .animate-horizontal-float:hover {
              animation-play-state: paused;
            }
            @keyframes softBobbing {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
            }
            .animate-bob {
              animation: softBobbing 4s ease-in-out infinite;
            }
          `,
        }}
      />

      {/* Page Title */}
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-700 bg-orange-100 px-3 py-1 rounded-full shadow-sm">
          ॥ आपली श्रद्धा • आपला सहभाग ॥
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-900 mt-3">
          देणगी व प्रमुख आश्रयदाते
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
          "मंदिर उभे राहते ते केवळ दगडांनी नाही, तर भक्तांच्या श्रद्धा आणि सहभागाने." आपल्या यथाशक्ती योगदानाने श्री काळंबादेवी मातेच्या जीर्णोद्धारात हातभार लावा.
        </p>
      </div>

      {copyStatus && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-2xl text-xs font-semibold animate-bounce">
          ✓ {copyStatus}
        </div>
      )}

      {/* ================= SECTION 1: HORIZONTALLY FLOATING TOP DONORS BANNER ================= */}
      <section className="mb-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-800 flex items-center justify-center gap-2">
            <span className="text-3xl drop-shadow">🏆</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600">
              प्रमुख दानशूर देणगीदार
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            मंदिराच्या कार्यात सिंहाचा वाटा उचलणारे परम आदरणीय भाविक (रोखण्यासाठी कार्डवर कर्सर आणा)
          </p>
        </div>

        {top5Donors.length > 0 ? (
          <div className="relative w-full overflow-hidden py-6">
            {/* Left & Right Gradient Shadows for seamless floating illusion */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-20"></div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-20"></div>

            {/* Continuous Moving Track (duplicated top5Donors 2x to loop seamlessly) */}
            <div className="animate-horizontal-float flex gap-6 items-center">
              {[...top5Donors, ...top5Donors].map((donor, index) => {
                const idx = index % top5Donors.length;
                const cfg = rankConfigs[idx] || rankConfigs[4];

                return (
                  <div
                    key={`${donor.id}-${index}`}
                    style={{ animationDelay: `${(idx % 2) * 1.5}s` }}
                    className={`animate-bob group relative w-72 sm:w-80 flex-shrink-0 rounded-3xl p-5 transition-all duration-300 ease-out transform hover:-translate-y-3 cursor-pointer shadow-md bg-white ${cfg.cardBg} ${cfg.ring} ${cfg.shadow}`}
                  >
                    {/* Rank Badge Header */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`inline-block bg-gradient-to-r ${cfg.bg} text-white px-3 py-1 rounded-full text-[10px] font-black tracking-wider shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                        {cfg.badge}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400 bg-white/70 px-2.5 py-0.5 rounded-full border border-gray-100">
                        {donor.city || 'मुंबई'}
                      </span>
                    </div>

                    {/* Donor Details with Round Avatar */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className={`w-13 h-13 min-w-[50px] min-h-[50px] rounded-2xl bg-white border-2 border-orange-100 flex items-center justify-center font-black text-xl shadow-md ${cfg.glow} group-hover:rotate-6 transition-transform duration-300`}>
                        <span className={`bg-clip-text text-transparent bg-gradient-to-br ${cfg.textGradient}`}>
                          {donor.donor_name?.charAt(0) || 'भ'}
                        </span>
                      </div>
                      <div className="overflow-hidden text-left">
                        <h3 className="font-extrabold text-gray-900 text-base leading-snug truncate group-hover:text-orange-700 transition-colors" title={donor.donor_name}>
                          {donor.donor_name}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                          {donor.category || 'बांधकाम निधी'}
                        </p>
                      </div>
                    </div>

                    {/* Amount Footer */}
                    <div className="pt-3 border-t border-gray-200/60 flex items-baseline justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                        देणगी रक्कम
                      </span>
                      <span className={`text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${cfg.textGradient} tracking-tight`}>
                        ₹ {parseFloat(donor.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-400 text-sm shadow-sm">
            <span className="text-3xl block mb-2 opacity-50">🙏</span>
            अद्याप देणग्यांची नोंद नाही. भाविकांच्या देणग्या प्राप्त होताच अग्रगण्य देणगीदारांचे बॅनर येथे प्रदर्शित होतील.
          </div>
        )}
      </section>

      {/* ================= SECTION 2: QR CODE & BANK TRANSFER PAYMENT ================= */}
      <section className="grid lg:grid-cols-12 gap-8 mb-14">
        {/* Left: QR Code Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-orange-300 p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
          <span className="text-xs font-bold text-white bg-orange-600 px-3 py-1 rounded-full uppercase mb-2">
            Scan & Pay via any UPI App
          </span>
          <h3 className="text-xl font-bold text-gray-800">थेट UPI द्वारे देणगी द्या</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Google Pay, PhonePe, Paytm, BHIM द्वारे QR कोड स्कॅन करा
          </p>

          <div className="w-56 h-56 bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl p-3 flex items-center justify-center shadow-inner relative group">
            {contactInfo?.donation_qr_url ? (
              <img
                src={contactInfo.donation_qr_url}
                alt="Mandir UPI QR Code"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center p-4 text-gray-400">
                <div className="text-3xl mb-1">📱</div>
                <p className="text-xs font-semibold">QR कोड लवकरच उपलब्ध होईल</p>
                <p className="text-[10px] text-gray-400">किंवा खालील UPI ID वापरा</p>
              </div>
            )}
          </div>

          <div className="mt-4 w-full bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">अधिकृत मंदिर UPI ID:</p>
            <div className="flex items-center justify-between mt-1 px-2 py-1 bg-white rounded border">
              <span className="font-mono text-sm font-bold text-orange-800 truncate">
                {contactInfo?.upi_id || 'kalambadevi@upi'}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(contactInfo?.upi_id || 'kalambadevi@upi', 'UPI ID')}
                className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold px-2.5 py-1 rounded transition ml-2"
              >
                कॉपी करा
              </button>
            </div>
          </div>

          <div className="flex justify-center items-center gap-3 mt-4 text-[11px] text-gray-500">
            <span>GPay</span>
            <span>•</span>
            <span>PhonePe</span>
            <span>•</span>
            <span>Paytm</span>
            <span>•</span>
            <span>BHIM UPI</span>
          </div>
        </div>

        {/* Right: Official Bank Account Details */}
        <div className="lg:col-span-7 bg-gradient-to-br from-orange-800 to-amber-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-orange-700/80 pb-3 mb-5">
              <div>
                <h3 className="text-xl font-bold">अधिकृत बँक खाते तपशील</h3>
                <p className="text-xs text-orange-200">NEFT / RTGS / IMPS द्वारे देणगी पाठवण्यासाठी</p>
              </div>
              <span className="text-2xl">🏛️</span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-orange-950/40 p-3.5 rounded-xl border border-orange-700/50 flex justify-between items-center">
                <div>
                  <p className="text-xs text-orange-300">खातेधारकाचे नाव (Account Name)</p>
                  <p className="font-bold text-sm sm:text-base">
                    {contactInfo?.trust_name || 'श्री काळंबादेवी मंदिर जीर्णोद्धार कमिटी'}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-orange-950/40 p-3.5 rounded-xl border border-orange-700/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-orange-300">बँकेचे नाव (Bank Name)</p>
                    <p className="font-bold">{contactInfo?.bank_name || 'State Bank of India'}</p>
                  </div>
                </div>

                <div className="bg-orange-950/40 p-3.5 rounded-xl border border-orange-700/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-orange-300">शाखा (Branch)</p>
                    <p className="font-bold">{contactInfo?.bank_branch || 'मुंबई'}</p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-orange-950/40 p-3.5 rounded-xl border border-orange-700/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-orange-300">खाते क्रमांक (Account Number)</p>
                    <p className="font-mono font-bold text-base sm:text-lg">
                      {contactInfo?.bank_acc_no || 'उपलब्ध नाही'}
                    </p>
                  </div>
                  {contactInfo?.bank_acc_no && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(contactInfo.bank_acc_no, 'खाते क्रमांक')}
                      className="text-xs bg-orange-700 hover:bg-orange-600 px-2.5 py-1 rounded font-medium"
                    >
                      कॉपी
                    </button>
                  )}
                </div>

                <div className="bg-orange-950/40 p-3.5 rounded-xl border border-orange-700/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-orange-300">IFSC कोड</p>
                    <p className="font-mono font-bold text-base sm:text-lg">
                      {contactInfo?.bank_ifsc || 'उपलब्ध नाही'}
                    </p>
                  </div>
                  {contactInfo?.bank_ifsc && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(contactInfo.bank_ifsc, 'IFSC कोड')}
                      className="text-xs bg-orange-700 hover:bg-orange-600 px-2.5 py-1 rounded font-medium"
                    >
                      कॉपी
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-orange-700/60 text-xs text-orange-200">
            ℹ️ बँक ट्रान्सफर किंवा UPI द्वारे देणगी दिल्यानंतर, अधिकृत पावती मिळवण्यासाठी खालील फॉर्ममध्ये आपला UTR / संदर्भ क्रमांक नोंदवा.
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: DONATION CAUSES & TIERS ================= */}
      <section className="mb-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">संकल्पित सेवा व निधी प्रकार</h2>
          <p className="text-xs text-gray-500 mt-1">आपण खालीलपैकी कोणत्याही विशिष्ट सेवेसाठी देणगी अर्पण करू शकता</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <CauseCard
            title="शिखर व सुवर्ण कळस सेवा"
            desc="मंदिराचे सर्वोच्च धार्मिक प्रतीक असणारा नक्षीदार कळस व शिखर उभारणीसाठी."
            icon="🚩"
          />
          <CauseCard
            title="मुख्य गर्भगृह जीर्णोद्धार"
            desc="काळंबादेवी मातेच्या मुख्य मंगलमय गाभारा, मखर व देवस्थान सुशोभीकरण."
            icon="🪔"
          />
          <CauseCard
            title="प्रशस्त सभामंडप व आधारस्तंभ"
            desc="सत्संग, भजन, कीर्तन व भाविकांना बसण्यासाठी भव्य सभामंडप उभारणी."
            icon="🏛️"
          />
          <CauseCard
            title="दीपमाळ, घंटामंडप व सुविधा"
            desc="पारंपारिक दीपमाळ, अखंड घंटा, पिण्याचे पाणी व भाविकांसाठी मूलभूत सुविधा."
            icon="🔔"
          />
        </div>
      </section>

      {/* ================= SECTION 4: DEVOTEE SUBMISSION FORM ================= */}
      <section className="bg-white rounded-2xl border border-orange-200 p-6 sm:p-10 shadow-sm mb-14">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-orange-900">
              देणगी पावतीसाठी नोंद करा (Submit Transfer Details)
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              आपण बँक किंवा QR कोडने पैसे पाठवले असल्यास, कृपया खालील तपशील भरा. कमिटीद्वारे पडताळणी करून आपली पावती तयार केली जाईल.
            </p>
          </div>

          {submittedSuccess ? (
            <div className="bg-green-50 border border-green-300 text-green-800 p-6 rounded-xl text-center space-y-2">
              <span className="text-3xl">🙏</span>
              <h3 className="text-lg font-bold">धन्यवाद! आपली नोंद यशस्वीरित्या प्राप्त झाली आहे.</h3>
              <p className="text-xs text-green-700">
                कमिटी आपले व्यवहार तपशील पडताळून देणगीदार यादीत नाव समाविष्ट करेल व अधिकृत पावती देईल.
              </p>
              <button
                onClick={() => setSubmittedSuccess(false)}
                className="mt-3 bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                आणखी नोंद करा
              </button>
            </div>
          ) : (
            <form onSubmit={handleDevoteeSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    देणगीदाराचे पूर्ण नाव (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. रमेश विठ्ठल पाटील"
                    value={devoteeForm.donor_name}
                    onChange={(e) => setDevoteeForm({ ...devoteeForm, donor_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    मोबाईल क्रमांक (Mobile Number) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="उदा. 98XXXXXXXX"
                    value={devoteeForm.phone}
                    onChange={(e) => setDevoteeForm({ ...devoteeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    गाव / शहर (City / Town)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. शेरपे / मुंबई"
                    value={devoteeForm.city}
                    onChange={(e) => setDevoteeForm({ ...devoteeForm, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    पाठवलेली रक्कम (Amount in ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="उदा. 5000"
                    value={devoteeForm.amount}
                    onChange={(e) => setDevoteeForm({ ...devoteeForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    सहभाग प्रकार (Donation Cause)
                  </label>
                  <select
                    value={devoteeForm.category}
                    onChange={(e) => setDevoteeForm({ ...devoteeForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="बांधकाम निधी">सामान्य बांधकाम निधी</option>
                    <option value="शिखर व सुवर्ण कळस">शिखर व सुवर्ण कळस</option>
                    <option value="मुख्य गर्भगृह">मुख्य गर्भगृह नूतनीकरण</option>
                    <option value="सभामंडप">प्रशस्त सभामंडप</option>
                    <option value="दीपमाळ व घंटामंडप">दीपमाळ व घंटामंडप</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    देणगी पद्धत (Payment Method)
                  </label>
                  <select
                    value={devoteeForm.payment_mode}
                    onChange={(e) => setDevoteeForm({ ...devoteeForm, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="UPI">UPI / QR Code (GPay, PhonePe, Paytm)</option>
                    <option value="NEFT">Bank Transfer (NEFT/IMPS/RTGS)</option>
                    <option value="रोख">रोख (Cash deposited to committee)</option>
                    <option value="धनादेश">धनादेश (Cheque)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    UPI UTR / Transaction Ref No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12 अंकी UTR किंवा संदर्भ क्रमांक"
                    value={devoteeForm.transaction_ref}
                    onChange={(e) => setDevoteeForm({ ...devoteeForm, transaction_ref: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  शुभसंदेश किंवा काही विशेष सूचना (Optional Message)
                </label>
                <textarea
                  rows="2"
                  placeholder="आपल्या कुलदैवतेसाठी काही प्रार्थना किंवा संदेश..."
                  value={devoteeForm.message}
                  onChange={(e) => setDevoteeForm({ ...devoteeForm, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg shadow-md transition disabled:opacity-50 text-sm"
              >
                {submitting ? 'नोंद पाठवत आहे...' : 'देणगी तपशील पाठवा (Submit Details)'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ================= SECTION 5: TRANSPARENT DONORS DIRECTORY ================= */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">सर्व देणगीदार यादी (Patrons Directory)</h3>
            <p className="text-xs text-gray-500 mt-1">
              एकूण देणगी: <strong className="text-orange-700">₹ {totalAmount.toLocaleString('en-IN')}</strong> • एकूण देणगीदार:{' '}
              <strong>{verifiedDonations.length}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="नाव किंवा शहर शोधा..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">सर्व प्रकार</option>
              <option value="बांधकाम निधी">बांधकाम निधी</option>
              <option value="शिखर व सुवर्ण कळस">शिखर व सुवर्ण कळस</option>
              <option value="मुख्य गर्भगृह">मुख्य गर्भगृह</option>
              <option value="सभामंडप">सभामंडप</option>
              <option value="दीपमाळ व घंटामंडप">दीपमाळ व घंटामंडप</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-orange-950 text-xs uppercase font-bold border-b border-orange-100">
              <tr>
                <th className="py-3 px-4">क्रमांक</th>
                <th className="py-3 px-4">देणगीदाराचे नाव</th>
                <th className="py-3 px-4">शहर / गाव</th>
                <th className="py-3 px-4">सहभाग प्रकार</th>
                <th className="py-3 px-4">पद्धत</th>
                <th className="py-3 px-4 text-right">रक्कम</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDonors.map((item, i) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-4 text-xs font-semibold text-gray-400">#{i + 1}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">{item.donor_name}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{item.city || 'मुंबई'}</td>
                  <td className="py-3 px-4 text-xs">
                    <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded font-medium">
                      {item.category || 'बांधकाम निधी'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{item.payment_mode || 'UPI'}</td>
                  <td className="py-3 px-4 text-right font-black text-orange-700">
                    ₹ {parseFloat(item.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}

              {filteredDonors.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                    कोणत्याही देणगीदाराची नोंद सापडली नाही.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CauseCard({ title, desc, icon }) {
  return (
    <div className="bg-white border border-orange-200/80 rounded-xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-800 text-base mb-1">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}