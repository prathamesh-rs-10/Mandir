import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const STORAGE_BUCKET = 'temple-assets';

export default function AdminDonationsPage({ showNotification }) {
  const [donations, setDonations] = useState([]);
  const [settingsId, setSettingsId] = useState(null);

  // Bank, QR & UPI States
  const [qrUrl, setQrUrl] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccNo, setBankAccNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [upiId, setUpiId] = useState('');
  const [showBankingSection, setShowBankingSection] = useState(true);
  const [savingBankInfo, setSavingBankInfo] = useState(false);

  // Donation Form States
  const [editingId, setEditingId] = useState(null);
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('बांधकाम निधी');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const loadData = async () => {
    // 1. Fetch donations from the unified table
    const { data: donData, error: donError } = await supabase
      .from('mandir_donations')
      .select('*')
      .eq('record_type', 'donation')
      .order('created_at', { ascending: false });

    if (donError) {
      showNotification('डेटा लोड करताना त्रुटी: ' + donError.message, 'error');
    } else if (donData) {
      setDonations(donData);
    }

    // 2. Fetch settings row from the same table
    const { data: settingsData } = await supabase
      .from('mandir_donations')
      .select('*')
      .eq('record_type', 'settings')
      .limit(1)
      .maybeSingle();

    if (settingsData) {
      setSettingsId(settingsData.id);
      setQrUrl(settingsData.donation_qr_url || '');
      setAccountHolderName(settingsData.bank_acc_holder_name || '');
      setBankName(settingsData.bank_name || '');
      setBankAccNo(settingsData.bank_acc_no || '');
      setBankIfsc(settingsData.bank_ifsc || '');
      setBankBranch(settingsData.bank_branch || '');
      setUpiId(settingsData.upi_id || '');
      setShowBankingSection(settingsData.show_banking_section !== false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Upload QR to Supabase Storage ('temple-assets') & save public URL
  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingQr(true);

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const cleanFileName = `qr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `qr-codes/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        showNotification('QR अपलोड त्रुटी: ' + uploadError.message, 'error');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        showNotification('पब्लिक URL मिळवण्यात त्रुटी आली.', 'error');
        return;
      }

      const payload = {
        record_type: 'settings',
        donation_qr_url: publicUrl,
        updated_at: new Date().toISOString(),
      };

      if (settingsId) payload.id = settingsId;

      const { data: updatedRecord, error: dbError } = await supabase
        .from('mandir_donations')
        .upsert(payload)
        .select()
        .maybeSingle();

      if (!dbError) {
        if (updatedRecord?.id) setSettingsId(updatedRecord.id);
        setQrUrl(publicUrl);
        showNotification('नवीन QR कोड यशस्वीरित्या सेव्ह झाला!');
      } else {
        showNotification('डेटाबेस त्रुटी: ' + dbError.message, 'error');
      }
    } catch (err) {
      showNotification('काहीतरी चूक झाली: ' + err.message, 'error');
    } finally {
      setUploadingQr(false);
      e.target.value = '';
    }
  };

  // Save Bank, UPI & Account Name
  const handleSaveBankInfo = async (e) => {
    e.preventDefault();
    setSavingBankInfo(true);

    const payload = {
      record_type: 'settings',
      bank_acc_holder_name: accountHolderName,
      bank_name: bankName,
      bank_acc_no: bankAccNo,
      bank_ifsc: bankIfsc,
      bank_branch: bankBranch,
      upi_id: upiId,
      show_banking_section: showBankingSection,
      donation_qr_url: qrUrl,
      updated_at: new Date().toISOString(),
    };

    if (settingsId) payload.id = settingsId;

    const { data: savedRecord, error } = await supabase
      .from('mandir_donations')
      .upsert(payload)
      .select()
      .maybeSingle();

    setSavingBankInfo(false);

    if (!error) {
      if (savedRecord?.id) setSettingsId(savedRecord.id);
      showNotification('बँक खाते, खातेधारकाचे नाव व UPI माहिती यशस्वीरित्या सेव्ह झाली!');
    } else {
      showNotification('त्रुटी: ' + error.message, 'error');
    }
  };

  // Manual Donation Add / Update
  const handleSubmitDonation = async (e) => {
    e.preventDefault();

    const payload = {
      record_type: 'donation',
      donor_name: donorName,
      amount: parseFloat(amount),
      city: city || 'मुंबई',
      phone: phone || null,
      category,
      payment_mode: paymentMode,
      transaction_ref: transactionRef || null,
      receipt_no: receiptNo || null,
      message: message || null,
      is_visible: isVisible,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from('mandir_donations')
        .update(payload)
        .eq('id', editingId);

      if (!error) {
        showNotification('देणगी नोंद यशस्वीरित्या अपडेट केली!');
        cancelEdit();
        loadData();
      } else {
        showNotification('त्रुटी: ' + error.message, 'error');
      }
    } else {
      payload.is_verified = true;
      const { error } = await supabase.from('mandir_donations').insert([payload]);

      if (!error) {
        showNotification('नवीन देणगी नोंद यशस्वीरित्या जोडली!');
        cancelEdit();
        loadData();
      } else {
        showNotification('त्रुटी: ' + error.message, 'error');
      }
    }
  };

  const handleEdit = (donation) => {
    setEditingId(donation.id);
    setDonorName(donation.donor_name || '');
    setAmount(donation.amount || '');
    setCity(donation.city || '');
    setPhone(donation.phone || '');
    setCategory(donation.category || 'बांधकाम निधी');
    setPaymentMode(donation.payment_mode || 'UPI');
    setTransactionRef(donation.transaction_ref || '');
    setReceiptNo(donation.receipt_no || '');
    setMessage(donation.message || '');
    setIsVisible(donation.is_visible !== false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDonorName('');
    setAmount('');
    setCity('');
    setPhone('');
    setTransactionRef('');
    setReceiptNo('');
    setMessage('');
    setIsVisible(true);
    setCategory('बांधकाम निधी');
    setPaymentMode('UPI');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('तुम्हाला खात्री आहे का की तुम्ही ही देणगी नोंद हटवू इच्छिता?')) return;

    const { error } = await supabase.from('mandir_donations').delete().eq('id', id);
    if (!error) {
      showNotification('देणगी नोंद हटवली!');
      loadData();
    } else {
      showNotification('त्रुटी: ' + error.message, 'error');
    }
  };

  // CSV Bulk Upload
  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;

      const rows = text.split('\n').filter((row) => row.trim() !== '');

      if (rows.length < 2) {
        showNotification('CSV फाईल रिकामी आहे किंवा योग्य फॉरमॅट नाही.', 'error');
        return;
      }

      const headers = rows[0].split(',').map((h) => h.trim().toLowerCase());
      const dataToInsert = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map((c) => c.trim());
        const record = {};

        headers.forEach((header, index) => {
          record[header] = cols[index];
        });

        if (record.donor_name && record.amount) {
          dataToInsert.push({
            record_type: 'donation',
            donor_name: record.donor_name,
            amount: parseFloat(record.amount),
            city: record.city || 'मुंबई',
            phone: record.phone || null,
            category: record.category || 'बांधकाम निधी',
            payment_mode: record.payment_mode || 'रोख',
            transaction_ref: record.transaction_ref || null,
            receipt_no: record.receipt_no || null,
            is_verified: true,
            is_visible: true,
          });
        }
      }

      if (dataToInsert.length > 0) {
        const { error } = await supabase.from('mandir_donations').insert(dataToInsert);
        if (!error) {
          showNotification(`${dataToInsert.length} देणगीदारांच्या नोंदी यशस्वीरित्या अपलोड झाल्या!`);
          loadData();
        } else {
          showNotification('अपलोड त्रुटी: ' + error.message, 'error');
        }
      } else {
        showNotification('CSV मध्ये कोणताही वैध डेटा आढळला नाही.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleVerification = async (id, currentStatus) => {
    await supabase.from('mandir_donations').update({ is_verified: !currentStatus }).eq('id', id);
    loadData();
    showNotification('देणगी पडताळणी स्थिती बदलली!');
  };

  const toggleVisibility = async (id, currentVisibility) => {
    await supabase.from('mandir_donations').update({ is_visible: !currentVisibility }).eq('id', id);
    loadData();
    showNotification('वेबसाइट दृश्यमानता बदलली!');
  };

  const totalAmount = donations
    .filter((d) => d.is_verified)
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 rounded-2xl flex flex-wrap justify-between items-center shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-orange-200 font-semibold">
            एकूण पडताळणी झालेली देणगी रक्कम
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1">
            ₹ {totalAmount.toLocaleString('en-IN')}
          </p>
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

      {/* BANK DETAILS, ACCOUNT HOLDER & QR CODE MANAGEMENT */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span>🏛️</span>
            <span>बँक खाते, खातेदार नाव व QR कोड व्यवस्थापन</span>
          </h2>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            <input
              type="checkbox"
              checked={showBankingSection}
              onChange={(e) => setShowBankingSection(e.target.checked)}
              className="h-4 w-4 text-orange-600 rounded"
            />
            <span>हा विभाग वेबसाइटवर दाखवा</span>
          </label>
        </div>

        {/* QR Code Upload Subsection */}
        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            📱 अधिकृत देणगी QR कोड
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
            <div className="w-40 h-40 bg-white border-2 border-dashed border-orange-300 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Donation QR Code"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">
                  QR कोड उपलब्ध नाही
                </span>
              )}
            </div>
            <div className="space-y-3 flex-1 w-full">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  नवीन QR कोड इमेज अपलोड करा:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  disabled={uploadingQr}
                  className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {uploadingQr && (
                  <p className="text-xs text-orange-600 animate-pulse font-medium mt-1">
                    QR कोड अपलोड होत आहे...
                  </p>
                )}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  किंवा थेट इमेज URL प्रविष्ट करा:
                </label>
                <input
                  type="url"
                  placeholder="https://.../qr.png"
                  value={qrUrl}
                  onChange={(e) => setQrUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank & UPI Input Form */}
        <form onSubmit={handleSaveBankInfo} className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            💳 बँक खाते, खातेदार नाव व UPI तपशील
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                खातेधारकाचे नाव (Account Name / Trust Name) *
              </label>
              <input
                type="text"
                required
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-semibold"
                placeholder="उदा. श्री काळंबादेवी मंदिर जीर्णोद्धार कमिटी"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                बँकेचे नाव (Bank Name)
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="उदा. State Bank of India"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                शाखा (Branch)
              </label>
              <input
                type="text"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="उदा. मुंबई"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                खाते क्रमांक (Account Number)
              </label>
              <input
                type="text"
                value={bankAccNo}
                onChange={(e) => setBankAccNo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                placeholder="उदा. 30123456789"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">IFSC कोड</label>
              <input
                type="text"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase"
                placeholder="उदा. SBIN0001234"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                अधिकृत देणगी UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                placeholder="उदा. mandirtrust@sbi"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingBankInfo}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-lg text-sm shadow transition disabled:opacity-50"
            >
              {savingBankInfo ? 'जतन करत आहे...' : 'बँक, खातेदार व UPI माहिती सेव्ह करा'}
            </button>
          </div>
        </form>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-base font-bold text-gray-800">
            {editingId ? '✏️ देणगी नोंद अपडेट करा' : '➕ नवीन देणगी नोंदवा'}
          </h2>

          {!editingId && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer px-3 py-1.5 rounded-md border border-gray-300">
                <span>Excel/CSV अपलोड करा</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-gray-400 max-w-[150px] leading-tight hidden sm:block">
                (Headers: donor_name, amount, city, phone, category, payment_mode)
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitDonation} className="grid sm:grid-cols-3 gap-4">
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

          <input
            type="text"
            placeholder="पावती क्र. (Receipt No.)"
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />

          <input
            type="text"
            placeholder="संदेश / प्रार्थना (Optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm sm:col-span-2"
          />

          <div className="sm:col-span-3 flex items-center justify-between mt-2 pt-2 border-t">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 text-orange-600 rounded"
              />
              <span>ही देणगी वेबसाइटवरील यादीत सार्वजनिकपणे दाखवा (Visible)</span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2 rounded-lg text-sm shadow transition"
              >
                {editingId ? 'बदल जतन करा (Save Changes)' : 'देणगी जतन करा (Save)'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-5 py-2 rounded-lg text-sm shadow transition"
                >
                  रद्द करा (Cancel)
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
        <h3 className="font-bold text-gray-800 mb-4">सर्व देणगीदार यादी ({donations.length})</h3>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <th className="py-2.5 px-3">नाव व संपर्क</th>
              <th className="py-2.5 px-3">गाव/शहर</th>
              <th className="py-2.5 px-3">निधी प्रकार</th>
              <th className="py-2.5 px-3">पावती / UTR</th>
              <th className="py-2.5 px-3 text-right">रक्कम</th>
              <th className="py-2.5 px-3 text-center">दृश्यमानता</th>
              <th className="py-2.5 px-3 text-center">पडताळणी</th>
              <th className="py-2.5 px-3 text-center">कृती (Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-gray-800">{d.donor_name}</div>
                  {d.phone && <div className="text-xs text-gray-400">मो: {d.phone}</div>}
                </td>
                <td className="py-2.5 px-3 text-sm">{d.city || 'मुंबई'}</td>
                <td className="py-2.5 px-3 text-xs">
                  {d.category}
                  <div className="text-[10px] text-gray-400 mt-0.5">{d.payment_mode || 'UPI'}</div>
                </td>
                <td className="py-2.5 px-3 text-xs">
                  {d.receipt_no && <div className="font-mono text-orange-800">पावती: {d.receipt_no}</div>}
                  {d.transaction_ref && (
                    <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
                      Ref: {d.transaction_ref}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-orange-700">
                  ₹ {parseFloat(d.amount).toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => toggleVisibility(d.id, d.is_visible !== false)}
                    className={`text-[11px] px-2 py-1 rounded-full font-semibold transition ${
                      d.is_visible !== false ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {d.is_visible !== false ? 'दाखवले 👁️' : 'लपवले 🙈'}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => toggleVerification(d.id, d.is_verified)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-full font-semibold transition ${
                      d.is_verified
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    {d.is_verified ? 'पूर्ण ✓' : 'अपूर्ण ⚠️'}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(d)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                      title="अपडेट करा (Edit)"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                      title="डिलीट करा (Delete)"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
