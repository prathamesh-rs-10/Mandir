import React, { useState } from 'react';

export default function AdminLayout({ adminUser, currentView, onNavigate, onLogout, onNavigateHome, children }) {
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  const navItems = [
    { id: 'admin-contact', label: 'संपर्क, नकाशा व माहिती', icon: '🗺️' },
    { id: 'admin-donations', label: 'देणगी व QR कोड', icon: '💰' },
    { id: 'admin-home', label: 'मुख्य पृष्ठ मजकूर', icon: '🏛️' },
    { id: 'admin-history', label: 'इतिहास व परंपरा', icon: '📜' },
    { id: 'admin-committee', label: 'कमिटी व विश्वस्त', icon: '👥' },
    { id: 'admin-reports', label: 'प्रगती अहवाल', icon: '📊' },
    { id: 'admin-events', label: 'उत्सव व कार्यक्रम', icon: '🚩' },
    { id: 'admin-gallery', label: 'छायाचित्रे', icon: '🖼️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-orange-800 text-white px-4 sm:px-8 py-3.5 flex justify-between items-center shadow-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-orange-600 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
            क
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold leading-tight">॥ श्री काळंबादेवी मंदिर व्यवस्थापन ॥</h1>
            <p className="text-xs text-orange-200">शेरपे, मुंबई • ॲडमिन नियंत्रण कक्ष</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-xs hidden md:inline bg-orange-950 px-3 py-1.5 rounded-full border border-orange-700">
            कार्यरत व्यवस्थापक: <strong className="text-orange-200">{adminUser?.username || 'Admin'}</strong>
          </span>
          <button
            onClick={onNavigateHome}
            className="text-xs bg-orange-700 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition font-medium"
          >
            वेबसाईट पहा
          </button>
          <button
            onClick={onLogout}
            className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-semibold transition"
          >
            लॉगआउट
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-72 bg-white border-r border-gray-200 p-4 shrink-0 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">विभाग व्यवस्थापन</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2.5 ${
                  currentView === item.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                }`}
              >
                <span>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Dynamic Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
          {feedback.message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm font-semibold border flex items-center justify-between ${
                feedback.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}
            >
              <span>{feedback.message}</span>
              <button onClick={() => setFeedback({ message: '', type: '' })} className="text-xs opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {typeof children === 'function' ? children({ showNotification }) : children}
        </main>
      </div>
    </div>
  );
}