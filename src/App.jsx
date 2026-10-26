import React, { useState, useEffect } from "react";
import AdminLogin from "./AdminLogin";

// Admin Shell & Pages
import AdminLayout from "./admin/AdminLayout";
import AdminContactPage from "./admin/AdminContactPage";
import AdminDonationsPage from "./admin/AdminDonationsPage";
import AdminHomePage from "./admin/AdminHomePage";
import AdminHistoryPage from "./admin/AdminHistoryPage";
import AdminCommitteePage from "./admin/AdminCommitteePage";
import AdminReportsPage from "./admin/AdminReportsPage";
import AdminEventsPage from "./admin/AdminEventsPage";
import AdminGalleryPage from "./admin/AdminGalleryPage";

// Client-Side Pages
import HomePage from "./HomePage";
import HistoryPage from "./HistoryPage";
import CommitteePage from "./CommitteePage";
import DonationsPage from "./DonationsPage";
import ReportPage from "./ReportPage";
import EventsPage from "./EventsPage";
import GalleryPage from "./GalleryPage";
import ContactPage from "./ContactPage";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [adminUser, setAdminUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Restore authenticated admin session
  useEffect(() => {
    const savedUser = localStorage.getItem("adminUser");
    if (savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("adminUser");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    setAdminUser(null);
    setCurrentView("home");
  };

  const handleLoginSuccess = (user) => {
    setAdminUser(user);
    setCurrentView("admin-contact");
  };

  const navLinks = [
    { id: "home", label: "मुख्य पृष्ठ" },
    { id: "history", label: "इतिहास" },
    { id: "committee", label: "कमिटी" },
    { id: "donations", label: "देणगीदार" },
    { id: "reports", label: "प्रगती अहवाल" },
    { id: "events", label: "कार्यक्रम" },
    { id: "gallery", label: "गॅलरी" },
    { id: "contact", label: "संपर्क" },
  ];

  // Check if current route is an admin view
  const isAdminView =
    currentView.startsWith("admin-") || currentView === "dashboard";

  // Protect Admin Routes
  if (isAdminView && !adminUser) {
    return (
      <AdminLogin
        onBackToHome={() => setCurrentView("home")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Render Admin Routes inside AdminLayout
  if (isAdminView) {
    const activeAdminRoute =
      currentView === "dashboard" ? "admin-contact" : currentView;

    return (
      <AdminLayout
        adminUser={adminUser}
        currentView={activeAdminRoute}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        onNavigateHome={() => setCurrentView("home")}
      >
        {({ showNotification }) => (
          <>
            {activeAdminRoute === "admin-contact" && (
              <AdminContactPage showNotification={showNotification} />
            )}
            {activeAdminRoute === "admin-donations" && (
              <AdminDonationsPage showNotification={showNotification} />
            )}
            {activeAdminRoute === "admin-home" && (
              <AdminHomePage showNotification={showNotification} />
            )}
            {activeAdminRoute === "admin-history" && (
              <AdminHistoryPage showNotification={showNotification} />
            )}
            {activeAdminRoute === "admin-committee" && (
              <AdminCommitteePage showNotification={showNotification} />
            )}
            {activeAdminRoute === "admin-reports" && (
              <AdminReportsPage showNotification={showNotification} />
            )}
            {activeAdminRoute === "admin-events" && (
              <AdminEventsPage showNotification={showNotification} />
            )}
            {activeAdminRoute === "admin-gallery" && (
              <AdminGalleryPage showNotification={showNotification} />
            )}
          </>
        )}
      </AdminLayout>
    );
  }

  // Login View
  if (currentView === "login") {
    return (
      <AdminLogin
        onBackToHome={() => setCurrentView("home")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Client-Side Views
  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-900 flex flex-col justify-between">
      <div>
        {/* Top Header Bar */}
        <div className="bg-orange-900 text-orange-100 px-4 sm:px-8 py-2 text-xs flex justify-between items-center border-b border-orange-800">
          <span className="font-medium tracking-wide">
            ॥ श्री काळंबादेवी प्रसन्न • शेरपे, मुंबई ॥
          </span>
          <div>
            {adminUser ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentView("admin-contact")}
                  className="bg-orange-700 hover:bg-orange-600 text-white px-2.5 py-1 rounded transition text-xs font-semibold"
                >
                  व्यवस्थापक पॅनेल (Admin Panel)
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-700 hover:bg-red-800 text-white px-2.5 py-1 rounded transition text-xs"
                >
                  लॉगआउट
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView("login")}
                className="hover:text-white transition underline font-medium"
              >
                व्यवस्थापक लॉगिन (Admin Login)
              </button>
            )}
          </div>
        </div>

        {/* Client Navbar */}
        <nav className="bg-orange-700 text-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-16">
            <div
              className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
              onClick={() => setCurrentView("home")}
            >
              <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center font-bold text-white shadow">
                क
              </div>
              <span className="font-bold text-lg sm:text-xl tracking-tight">
                श्री काळंबादेवी मंदिर
              </span>
            </div>

            {/* Desktop Horizontal Navigation */}
            <div className="hidden lg:flex flex-row items-center space-x-1 flex-nowrap overflow-x-auto">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setCurrentView(link.id)}
                  className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                    currentView === link.id
                      ? "bg-orange-900 text-white shadow-inner"
                      : "hover:bg-orange-600 text-orange-100 hover:text-white"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-orange-200 hover:text-white focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                <span className="text-xl">☰</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-orange-800 px-4 pt-2 pb-4 space-y-1 border-t border-orange-600">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setCurrentView(link.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === link.id
                      ? "bg-orange-950 text-white"
                      : "text-orange-200 hover:bg-orange-700 hover:text-white"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Client Page Content */}
        <main>
          {currentView === "home" && <HomePage onNavigate={setCurrentView} />}
          {currentView === "history" && <HistoryPage />}
          {currentView === "committee" && <CommitteePage />}
          {currentView === "donations" && <DonationsPage />}
          {currentView === "reports" && <ReportPage />}
          {currentView === "events" && <EventsPage />}
          {currentView === "gallery" && <GalleryPage />}
          {currentView === "contact" && <ContactPage />}
        </main>
      </div>

      {/* Global Footer */}
      <footer className="bg-gray-950 text-gray-400 py-10 px-6 border-t-4 border-orange-600 text-center mt-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-wide">
              श्री काळंबादेवी मंदिर जीर्णोद्धार कमिटी, शेरपे, मुंबई
            </h3>
            <p className="text-sm text-gray-300">
              व्यवस्थापक : श्री काळंबादेवी मंडळ (रजिस्टर)
            </p>
          </div>

          {/* Footer Navigation Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 py-4 border-y border-gray-800">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentView(link.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`text-xs sm:text-sm transition-colors ${
                  currentView === link.id
                    ? "text-orange-400 font-semibold underline underline-offset-4"
                    : "text-gray-300 hover:text-orange-300"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex justify-center flex-wrap gap-4 text-xs text-gray-500">
            <span>आपली श्रद्धा | आपला वारसा | आपल्या पुढील पिढ्यांसाठी</span>
            <span>•</span>
            <span>शेरपे, मुंबई</span>
          </div>

          <p className="text-xs text-gray-600">
            टीप: संकेतस्थळावरील आराखडे व माहिती सादरीकरणासाठीचे संकल्पनात्मक
            नमुने आहेत.
          </p>
        </div>
      </footer>
    </div>
  );
}
