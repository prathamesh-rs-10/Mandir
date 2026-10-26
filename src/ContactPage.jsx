import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function ContactPage() {
  const [info, setInfo] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');

  // Devotee enquiry form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubject, setFormSubject] = useState('पूजा व दर्शन विचारणा');
  const [formMessage, setFormMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from('mandir_contact_info')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setInfo(data);
      });
  }, []);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyStatus(`${label} कॉपी झाले!`);
    setTimeout(() => setCopyStatus(''), 3000);
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('mandir_enquiries').insert([
      {
        name: formName,
        phone: formPhone,
        email: formEmail,
        subject: formSubject,
        message: formMessage,
      },
    ]);

    setSubmitting(false);
    if (!error) {
      setSubmitSuccess(true);
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setFormMessage('');
    }
  };

  const mapEmbedUrl =
    info?.map_embed_url ||
    'https://maps.google.com/maps?q=GMRM%2BFPF,+Sherpe+Rd,+Sherpe,+Maharashtra+416703&t=&z=15&ie=UTF8&iwloc=&output=embed';
  const mapLink = info?.map_link || 'https://maps.app.goo.gl/FDyfpDm4Rm2xpcB19';
  const plusCode = info?.plus_code || 'GMRM+FPF, Sherpe Rd, Sherpe, Maharashtra 416703';

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 font-sans">
      {/* Toast Notification */}
      {copyStatus && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-semibold">
          ✓ {copyStatus}
        </div>
      )}

      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
          ॥ संपर्क व माहिती कक्ष ॥
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-950 mt-2">
          मंदिर संपर्क, स्थान व दर्शन माहिती
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-2">
          श्री काळंबादेवी मंदिराचे अचूक गुगल मॅप स्थान, प्रवास मार्गदर्शन आणि दर्शन वेळापत्रक.
        </p>
      </div>

      {/* ================= DEDICATED GOOGLE MAP CARD ================= */}
      <section className="bg-white rounded-3xl border border-orange-200 overflow-hidden shadow-md mb-12">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-orange-800 to-amber-900 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-200">
                लाईव्ह गुगल मॅप स्थान (Live Google Map)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              श्री काळंबादेवी मंदिर, शेरपे
            </h2>
            <p className="text-xs text-orange-100 mt-0.5">
              शेरपे रोड, मु. पो. शेरपे, ता. कणकवली, जि. सिंधुदुर्ग, महाराष्ट्र - ४१६७०३
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow transition flex items-center gap-2 shrink-0"
            >
              <span>🧭</span>
              <span>Google Maps ॲपमध्ये उघडा</span>
            </a>
          </div>
        </div>

        {/* Card Body: Interactive Embedded Map */}
        <div className="w-full h-80 sm:h-96 md:h-[420px] bg-gray-100 relative">
          <iframe
            title="Shri Kalambadevi Mandir Interactive Location Map"
            src={mapEmbedUrl}
            className="w-full h-full border-0"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        {/* Card Footer: Location Meta & Quick Actions */}
        <div className="p-4 sm:p-5 bg-orange-50/70 border-t border-orange-100 grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3 rounded-xl border border-orange-150 flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-medium">Google Maps Plus Code</p>
              <p className="font-mono font-bold text-orange-950 mt-0.5">{plusCode}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(plusCode, 'Plus Code')}
              className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-1 rounded font-semibold transition shrink-0 ml-2"
            >
              कॉपी
            </button>
          </div>

          <div className="bg-white p-3 rounded-xl border border-orange-150">
            <p className="text-gray-400 font-medium">जवळचा महामार्ग</p>
            <p className="font-bold text-gray-800 mt-0.5">मुंबई-गोवा राष्ट्रीय महामार्ग (NH 66) - खारेपाटण फाटा</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-orange-150 sm:col-span-2 md:col-span-1 flex items-center justify-between">
            <div>
              <p className="text-gray-400 font-medium">स्थानिक संदर्भ</p>
              <p className="font-bold text-gray-800 mt-0.5">कणकवली / वैभववाडी तालुका सीमा</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(mapLink, 'मॅप लिंक')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold transition"
            >
              शेअर लिंक
            </button>
          </div>
        </div>
      </section>

      {/* ================= HOW TO REACH ================= */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">कसे पोहोचावे? (How to Reach)</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            शेरपे, ता. कणकवली येथे येण्यासाठी रेल्वे, रस्ता, एसटी बस व विमान पर्याय
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center text-2xl mb-3">
              🚆
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">रेल्वेने (By Train)</h3>
            <p className="text-xs font-semibold text-orange-700 mb-2">कोकण रेल्वे मार्ग</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {info?.nearest_railway || 'जवळचे स्टेशन: कणकवली (~३५ किमी) किंवा वैभववाडी रोड (~२२ किमी). स्टेशनबाहेरून नियमित रिक्षा व स्थानिक वाहने उपलब्ध.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center text-2xl mb-3">
              🚗
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">रस्त्याने (By Road)</h3>
            <p className="text-xs font-semibold text-orange-700 mb-2">मुंबई-गोवा महामार्ग (NH 66)</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {info?.how_to_reach_road || 'महामार्गावरून खारेपाटण किंवा नाधवडे मार्गे थेट शेरपे गावात पोहोचता येते. रस्ता डांबरीकरण केलेला असून मंदिराजवळ वाहनतळ आहे.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center text-2xl mb-3">
              🚌
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">एस.टी. बसने (By ST Bus)</h3>
            <p className="text-xs font-semibold text-orange-700 mb-2">MSRTC व खाजगी बसेस</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {info?.how_to_reach_bus || 'मुंबई, ठाणे व पुणे येथून खारेपाटण / कणकवली जाणाऱ्या बसेस उपलब्ध आहेत. खारेपाटण बस स्थानकावरून शेरपेसाठी नियमित रिक्षा मिळतात.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center text-2xl mb-3">
              ✈️
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">विमानाने (By Air)</h3>
            <p className="text-xs font-semibold text-orange-700 mb-2">जवळची विमानतळे</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {info?.nearest_airport || 'सिंधुदुर्ग चिपी विमानतळ (SDW ~६५ किमी) किंवा मनोहर आंतरराष्ट्रीय विमानतळ (मोपा, गोवा GOX ~११० किमी).'}
            </p>
          </div>
        </div>
      </section>

      {/* ================= DARSHAN & AARTI TIMETABLE ================= */}
      <section className="bg-gradient-to-r from-orange-800 to-amber-900 text-white rounded-2xl p-6 sm:p-10 shadow-md mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-widest text-orange-300 font-bold bg-orange-950/60 px-3 py-1 rounded-full">
              नित्य उपासना व वेळापत्रक
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">दर्शन, महापूजा व आरती वेळा</h2>
            <p className="text-xs sm:text-sm text-orange-200 mt-1">
              मंदिर उघडण्याची वेळ: <strong>{info?.darshan_timings || 'सकाळी ५:३० ते रात्री ९:३० पर्यंत'}</strong>
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-orange-950/50 border border-orange-700/50 p-4 rounded-xl text-center">
              <span className="text-xs text-orange-300 font-semibold">प्रातः काळ</span>
              <h4 className="text-base font-bold text-white mt-1">काकड आरती व स्नान</h4>
              <p className="text-lg font-black text-amber-300 mt-1">सकाळी ६:०० वा.</p>
              <p className="text-[11px] text-orange-200 mt-1">मातेचे चरणस्पर्श व अभिषेक</p>
            </div>

            <div className="bg-orange-950/50 border border-orange-700/50 p-4 rounded-xl text-center">
              <span className="text-xs text-orange-300 font-semibold">दुपार</span>
              <h4 className="text-base font-bold text-white mt-1">दुपारची महाआरती</h4>
              <p className="text-lg font-black text-amber-300 mt-1">दुपारी १२:०० वा.</p>
              <p className="text-[11px] text-orange-200 mt-1">नैवेद्य व सामूहिक प्रार्थना</p>
            </div>

            <div className="bg-orange-950/50 border border-orange-700/50 p-4 rounded-xl text-center">
              <span className="text-xs text-orange-300 font-semibold">संध्याकाळ</span>
              <h4 className="text-base font-bold text-white mt-1">सांज आरती व दीपप्रज्वलन</h4>
              <p className="text-lg font-black text-amber-300 mt-1">सायं. ७:३० वा.</p>
              <p className="text-[11px] text-orange-200 mt-1">दीपमाळ व घंटानाद</p>
            </div>

            <div className="bg-orange-950/50 border border-orange-700/50 p-4 rounded-xl text-center">
              <span className="text-xs text-orange-300 font-semibold">रात्र</span>
              <h4 className="text-base font-bold text-white mt-1">शयन आरती</h4>
              <p className="text-lg font-black text-amber-300 mt-1">रात्री ९:१५ वा.</p>
              <p className="text-[11px] text-orange-200 mt-1">मंदिर कपाट बंद</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= OFFICE CONTACT & ENQUIRY FORM ================= */}
      <section className="grid lg:grid-cols-12 gap-8">
        {/* Office Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-orange-200 p-6 sm:p-7 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
              <span>🏛️</span>
              <span>अधिकृत मंडळ कार्यालय संपर्क</span>
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-semibold">व्यवस्थापक संस्था</p>
                <p className="font-bold text-gray-800">
                  {info?.trust_name || 'श्री काळंबादेवी मंदिर जीर्णोद्धार कमिटी, शेरपे, मुंबई'}
                </p>
                <p className="text-xs text-orange-700 font-medium">
                  {info?.reg_number || 'श्री काळंबादेवी मंडळ (रजिस्टर)'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold">प्राथमिक हेल्पलाइन व संपर्क</p>
                <a
                  href={`tel:${(info?.phone_primary || '+91 9820123451').replace(/[^0-9+]/g, '')}`}
                  className="font-bold text-orange-700 hover:text-orange-900 text-base inline-block mt-0.5"
                >
                  📞 {info?.phone_primary || '+91 98201 23451'}
                </a>
                {info?.phone_secondary && (
                  <p className="text-xs text-gray-600 mt-0.5">दुय्यम: {info?.phone_secondary}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold">अधिकृत ईमेल</p>
                <a
                  href={`mailto:${info?.email || 'contact@kalambadevi.org'}`}
                  className="font-medium text-gray-800 hover:text-orange-700 text-sm"
                >
                  ✉️ {info?.email || 'contact@kalambadevi.org'}
                </a>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold">स्थानिक मंदिर पत्ता (कोकण)</p>
                <p className="text-xs text-gray-700 leading-relaxed mt-0.5">
                  मु. पो. शेरपे, खारेपाटण-नाधवडे रोड, ता. कणकवली, जि. सिंधुदुर्ग - ४१६७०३.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h4 className="font-bold text-orange-950 text-sm mb-2 flex items-center gap-1.5">
              <span>🙏</span>
              <span>भाविकांसाठी नियम व शिष्टाचार</span>
            </h4>
            <ul className="text-xs text-gray-700 space-y-1.5 leading-relaxed list-disc list-inside">
              <li>मंदिराच्या गाभाऱ्यात शांतता व पावित्र्य राखावे.</li>
              <li>दर्शन रांगेत वृद्ध, महिला व लहान बालकांना सहकार्य करावे.</li>
              <li>मंदिर परिसरात व शेरपे गावात प्लास्टिकचा कचरा टाकू नये.</li>
              <li>विशेष अभिषेक व पूजेसाठी पूर्वनोंदणी करावी.</li>
            </ul>
          </div>
        </div>

        {/* Enquiry Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-orange-200 p-6 sm:p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            थेट विचारणा / संपर्क संदेश (Devotee Helpdesk)
          </h3>
          <p className="text-xs text-gray-500 mb-6">
            पूजेची वेळ, दर्शन किंवा जीर्णोद्धाराविषयी काही प्रश्न असल्यास थेट संदेश पाठवा.
          </p>

          {submitSuccess ? (
            <div className="bg-green-50 border border-green-300 text-green-800 p-6 rounded-xl text-center space-y-2">
              <span className="text-3xl">🙏</span>
              <h4 className="font-bold text-lg">आपला संदेश यशस्वीरित्या पाठवला गेला आहे!</h4>
              <p className="text-xs text-green-700">
                कमिटीचे प्रतिनिधी आपल्या दिलेल्या मोबाईल नंबरवर लवकरच संपर्क साधतील.
              </p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="mt-3 bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                दुसरा संदेश पाठवा
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    आपले पूर्ण नाव (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. अमित कदम"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
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
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ईमेल (Email ID)
                  </label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    विषय (Subject)
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="पूजा व दर्शन विचारणा">पूजा व दर्शन विचारणा</option>
                    <option value="जीर्णोद्धार देणगी मदत">जीर्णोद्धार देणगी मदत</option>
                    <option value="स्वयंसेवक सहभाग">स्वयंसेवक सहभाग</option>
                    <option value="इतर सूचना व अभिप्राय">इतर सूचना व अभिप्राय</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  आपला संदेश / विचारणा (Your Message) *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="आपला प्रश्न किंवा संदेश येथे लिहा..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50 text-sm"
              >
                {submitting ? 'संदेश पाठवत आहे...' : 'संदेश पाठवा (Send Message)'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}