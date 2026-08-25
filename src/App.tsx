import { useState, useEffect } from 'react';
import { ViewMode, QuoteInput, SellerDeliveryLink } from './types';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { NotificationToast, ToastMessage } from './components/common/NotificationToast';

import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PricingPage } from './pages/PricingPage';
import { BecomeDriverPage } from './pages/BecomeDriverPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { AboutPage } from './pages/AboutPage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';
import { QuotePage } from './pages/QuotePage';
import { BookingPage } from './pages/BookingPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SellerLinkGeneratorPage } from './pages/SellerLinkGeneratorPage';
import { SellerAccountPage } from './pages/SellerAccountPage';
import { LegalPage } from './pages/LegalPage';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('home');
  const [currentQuoteInput, setCurrentQuoteInput] = useState<QuoteInput | null>(null);
  const [activeSellerLink, setActiveSellerLink] = useState<SellerDeliveryLink | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sellerAccountVerified, setSellerAccountVerified] = useState(false);

  // Check URL query parameters on initial mount (e.g. ?seller_link=... or ?view=for-sellers)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('seller_link') || params.get('checkout')) {
        setActiveView('book-now');
      } else if (params.get('seller_account')) {
        setActiveView('seller-account');
        setSellerAccountVerified(params.get('seller_account') === 'verified');
      } else if (params.get('view') === 'for-sellers') {
        setActiveView('for-sellers');
      }
    }
  }, []);

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView]);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleBookNowFromQuote = (quote: QuoteInput) => {
    setCurrentQuoteInput(quote);
    setActiveSellerLink(null);
    setActiveView('book-now');
    showToast('Quote Selected', `Locked in quote for ${quote.itemType}`, 'info');
  };

  const handleOpenSellerLinkBooking = (link: SellerDeliveryLink) => {
    setActiveSellerLink(link);
    setActiveView('book-now');
    showToast('Buyer Link Opened', `Viewing booking checkout for ${link.itemTitle}`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sticky Header Navbar */}
      <Navbar activeView={activeView} onNavigate={setActiveView} />

      {/* Main Page Routing Container */}
      <main className="flex-1">
        {activeView === 'home' && (
          <HomePage
            onNavigate={setActiveView}
            onBookNow={handleBookNowFromQuote}
          />
        )}

        {activeView === 'how-it-works' && (
          <HowItWorksPage onNavigate={setActiveView} />
        )}

        {activeView === 'pricing' && (
          <PricingPage onBookNow={handleBookNowFromQuote} onNavigate={setActiveView} />
        )}

        {activeView === 'for-sellers' && (
          <SellerLinkGeneratorPage
            onNavigate={setActiveView}
            onShowToast={showToast}
            onOpenSellerLink={handleOpenSellerLinkBooking}
          />
        )}

        {activeView === 'seller-account' && <SellerAccountPage onNavigate={setActiveView} onShowToast={showToast} justVerified={sellerAccountVerified} />}

        {activeView === 'become-driver' && (
          <BecomeDriverPage onNavigate={setActiveView} onShowToast={showToast} />
        )}

        {activeView === 'businesses' && (
          <BusinessesPage onNavigate={setActiveView} onShowToast={showToast} />
        )}

        {activeView === 'about' && (
          <AboutPage onNavigate={setActiveView} />
        )}

        {activeView === 'faq' && (
          <FAQPage onNavigate={setActiveView} />
        )}

        {activeView === 'contact' && (
          <ContactPage onShowToast={showToast} />
        )}

        {activeView === 'get-quote' && (
          <QuotePage onBookNow={handleBookNowFromQuote} onNavigate={setActiveView} />
        )}

        {activeView === 'book-now' && (
          <BookingPage
            initialQuote={currentQuoteInput}
            activeSellerLink={activeSellerLink}
            onNavigate={setActiveView}
            onShowToast={showToast}
          />
        )}

        {activeView === 'customer-dashboard' && (
          <CustomerDashboardPage onNavigate={setActiveView} onShowToast={showToast} />
        )}

        {activeView === 'driver-dashboard' && (
          <DriverDashboardPage onNavigate={setActiveView} onShowToast={showToast} />
        )}

        {activeView === 'admin-dashboard' && (
          <AdminDashboardPage onNavigate={setActiveView} onShowToast={showToast} />
        )}

        {activeView === 'privacy' && <LegalPage type="privacy" />}
        {activeView === 'terms' && <LegalPage type="terms" />}
        {activeView === 'refund-policy' && <LegalPage type="refund-policy" />}
      </main>

      {/* Footer */}
      <Footer onNavigate={setActiveView} />

      {/* Floating Notifications Toast Container */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}

