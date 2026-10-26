import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminDonationsPage({ showNotification }) {
  const [donations, setDonations] = useState([]);
  const [qrUrl, setQrUrl] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [contactId, setContactId] = useState(null);

  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('बांधकाम निधी');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');

  const loadData = async () => {
    const { data: donData } = await supabase
      .from('mandir_donations')
      .select('*')
      .order('created_at', { ascending: false });
    if (donData) setDonations(donData);

    const { data: infoData } = await supabase
      .from('mandir_contact_info')
      .select('id, donation_qr_url')
      .limit(1)
      .single();

    if (infoData) {
      setContactId(infoData.id);
      setQrUrl(infoData.donation_qr_url || '');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingQr(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `temple-donation-qr-${Date.now()}.${fileExt}`;
    const filePath = `qr-codes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('temple-assets')
      .upload(filePath, file);

    if (uploadError) {
      showNotification('QR अपलोड त्रुटी: ' + uploadError.message, 'error');
      setUploadingQr(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('temple-assets')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    const { error: dbError } = await supabase
      .from('mandir_contact_info')
      .upsert({ id: contactId || 1, donation_qr_url: publicUrl, updated_at: new Date() });

    setUploadingQr(false);
    if (!dbError) {
      setQrUrl(publicUrl);
      showNotification('नवीन QR कोड यशस्वीरित्या सेव्ह झाला!');
    }
  };

  const handleAddDonation = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('mandir_donations').insert([
      {
        donor_name: donorName,
        amount: parseFloat(amount),
        city,
        phone,
        category,
        payment_mode: paymentMode,
        transaction_ref: transactionRef,
        is_verified: true,
      },
    ]);

    if (!error) {
      setDonorName('');
      setAmount('');
      setCity('');
      setPhone('');
      setTransactionRef('');
      loadData();
      showNotification('देणगी नोंद यशस्वीरित्या जोडली!');
    } else {
      showNotification('त्रुटी: ' + error.message, 'error');
    }
  };

  const toggleVerification = async (id, currentStatus) => {
    await supabase.from('mandir_donations').update({ is_verified: !currentStatus }).eq('id', id);
    loadData();
    showNotification('देणगी पडताळणी स्थिती बदलली!');
  };

  const totalAmount = donations
    .filter((d) => d.is_verified)
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const topDonors = [...donations]
    .filter((d) => d.is_verified)
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 rounded-2xl flex flex-wrap justify-between items-center shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-orange-200 font-semibold">एकूण पडताळणी झालेली देणगी रक्कम</p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1">₹ {totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-6 text-right">
          <div>
            <p className="text-xs text-orange-200">एकूण देणगीदार</p>
            <p className="text-2xl font-bold">{donations.length}</p>
          </div>
          <div>
            <p className="text-xs text-orange-200">पडताळणी प्रलंबित</p>
            <p className="text-2xl font-bold text-yellow-300">
              {donations.filter((d) => !d.is_verified).length}
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Upload */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">
          📱 मंदिर देणगी QR कोड व्यवस्थापन
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
          <div className="w-40 h-40 bg-gray-50 border-2 border-dashed border-orange-300 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
            {qrUrl ? (
              <img src={qrUrl} alt="Donation QR Code" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-xs text-gray-400 text-center px-2">QR कोड उपलब्ध नाही</span>
            )}
          </div>
          <div className="space-y-3 flex-1 w-full">
            <input
              type="file"
              accept="image/*"
              onChange={handleQrUpload}
              disabled={uploadingQr}
              className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {uploadingQr && <p className="text-xs text-orange-600 animate-pulse font-medium">QR कोड अपलोड होत आहे...</p>}
            <div className="flex gap-2 pt-2">
              <input
                type="url"
                placeholder="किंवा इमेज URL पेस्ट करा"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={async () => {
                  await supabase
                    .from('mandir_contact_info')
                    .upsert({ id: contactId || 1, donation_qr_url: qrUrl, updated_at: new Date() });
                  showNotification('QR URL सेव्ह झाली!');
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                सेव्ह
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center justify-between border-b pb-2">
          <span>🏆 अग्रगण्य ५ दानशूर देणगीदार</span>
          <span className="text-xs text-orange-600 font-semibold">वेबसाईटवर बॅनर स्वरूपात प्रदर्शित</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {topDonors.map((d, index) => (
            <div key={d.id} className="p-3 rounded-xl border text-center bg-amber-50/50 border-amber-200">
              <span className="text-[11px] font-bold text-gray-500">मान #{index + 1}</span>
              <p className="font-bold text-sm text-gray-800 truncate mt-1" title={d.donor_name}>{d.donor_name}</p>
              <p className="text-xs text-gray-500">{d.city || 'मुंबई'}</p>
              <p className="text-sm font-extrabold text-orange-700 mt-2">
                ₹ {parseFloat(d.amount).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4 border-b pb-2">नवीन देणगी नोंदवा</h2>
        <form onSubmit={handleAddDonation} className="grid sm:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="देणगीदाराचे नाव *"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            required
          />
          <input
            type="number"
            placeholder="रक्कम (₹) *"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            required
          />
          <input
            type="text"
            placeholder="गाव / शहर"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="मोबाईल क्र."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="बांधकाम निधी">बांधकाम निधी</option>
            <option value="शिखर व सुवर्ण कळस">शिखर व सुवर्ण कळस</option>
            <option value="मुख्य गर्भगृह">मुख्य गर्भगृह</option>
            <option value="सभामंडप">सभामंडप</option>
            <option value="दीपमाळ व घंटामंडप">दीपमाळ व घंटामंडप</option>
          </select>
          <div className="flex gap-2">
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-1/3 px-2 py-2 border rounded-lg text-xs font-semibold"
            >
              <option value="UPI">UPI</option>
              <option value="रोख">रोख</option>
              <option value="NEFT">NEFT</option>
              <option value="धनादेश">धनादेश</option>
            </select>
            <input
              type="text"
              placeholder="UTR / संदर्भ क्र."
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-2/3 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow"
            >
              देणगी जतन करा
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
        <h3 className="font-bold text-gray-800 mb-4">सर्व देणगीदार यादी ({donations.length})</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <th className="py-2.5 px-3">नाव व संपर्क</th>
              <th className="py-2.5 px-3">गाव/शहर</th>
              <th className="py-2.5 px-3">निधी प्रकार</th>
              <th className="py-2.5 px-3">पद्धत व UTR</th>
              <th className="py-2.5 px-3 text-right">रक्कम</th>
              <th className="py-2.5 px-3 text-center">पडताळणी</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-gray-800">{d.donor_name}</div>
                  {d.phone && <div className="text-xs text-gray-400">मो: {d.phone}</div>}
                </td>
                <td className="py-2.5 px-3 text-sm">{d.city || 'मुंबई'}</td>
                <td className="py-2.5 px-3 text-xs">{d.category}</td>
                <td className="py-2.5 px-3 text-xs">{d.payment_mode || 'UPI'}</td>
                <td className="py-2.5 px-3 text-right font-bold text-orange-700">
                  ₹ {parseFloat(d.amount).toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => toggleVerification(d.id, d.is_verified)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition ${
                      d.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {d.is_verified ? 'पूर्ण ✓' : 'अपूर्ण'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}