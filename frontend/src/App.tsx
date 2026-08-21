import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';

import { DashboardSkeleton } from './components/skeletons/DashboardSkeleton';
import { TableSkeleton } from './components/skeletons/TableSkeleton';
import { SettingsSkeleton } from './components/skeletons/SettingsSkeleton';
import { AgreementSkeleton } from './components/skeletons/AgreementSkeleton';

// Lazy loading view components for optimal bundle splitting
const LandingPage = lazy(() => import('./views/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./views/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./views/Dashboard').then(m => ({ default: m.Dashboard })));
const Clients = lazy(() => import('./views/Clients').then(m => ({ default: m.Clients })));
const Invoices = lazy(() => import('./views/Invoices').then(m => ({ default: m.Invoices })));
const InvoiceEdit = lazy(() => import('./views/InvoiceEdit').then(m => ({ default: m.InvoiceEdit })));
const Agreements = lazy(() => import('./views/Agreements').then(m => ({ default: m.Agreements })));
const AgreementCreate = lazy(() => import('./views/AgreementCreate').then(m => ({ default: m.AgreementCreate })));
const AgreementVerify = lazy(() => import('./views/AgreementVerify').then(m => ({ default: m.AgreementVerify })));
const ApiDocs = lazy(() => import('./views/ApiDocs').then(m => ({ default: m.ApiDocs })));
const Billing = lazy(() => import('./views/Billing').then(m => ({ default: m.Billing })));
const CheckoutMock = lazy(() => import('./views/Billing').then(m => ({ default: m.CheckoutMock })));
const PortalMock = lazy(() => import('./views/Billing').then(m => ({ default: m.PortalMock })));
const Settings = lazy(() => import('./views/Settings').then(m => ({ default: m.Settings })));
const BillDesign = lazy(() => import('./views/BillDesign').then(m => ({ default: m.BillDesign })));
const TemplateBuilder = lazy(() => import('./views/TemplateBuilder').then(m => ({ default: m.TemplateBuilder })));
const Admin = lazy(() => import('./views/Admin').then(m => ({ default: m.Admin })));
const EmailDesign = lazy(() => import('./views/EmailDesign').then(m => ({ default: m.EmailDesign })));

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans, sans-serif)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Authenticating Tenant...
          </span>
        </div>
      </div>
    );
  }

  // If user is not logged in, render public routes (Landing Page, Login, Public Agreement Creator, Verification Portal, API Docs)
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/agreements/new" element={<AgreementCreate />} />
          <Route path="/agreements/public" element={<AgreementCreate />} />
          <Route path="/verify/:hash" element={<AgreementVerify />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Unverified Email Banner */}
      <EmailVerificationBanner />

      {/* Mobile Header Bar */}
      <MobileHeader onOpenDrawer={() => setMobileDrawerOpen(true)} />

      {/* Mobile Side Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)} />
      )}

      {/* Mobile Slide-out Drawer */}
      <div className={`mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
        <Sidebar isDrawer onCloseMobileDrawer={() => setMobileDrawerOpen(false)} />
      </div>

      <Routes>
        {/* Public / Standalone Views without Sidebar */}
        <Route
          path="/landing"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route
          path="/verify/:hash"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <AgreementVerify />
            </Suspense>
          }
        />
        <Route
          path="/api-docs"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <ApiDocs />
            </Suspense>
          }
        />
        <Route
          path="/billing/checkout-mock"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <CheckoutMock />
            </Suspense>
          }
        />
        <Route
          path="/billing/portal-mock"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <PortalMock />
            </Suspense>
          }
        />
        <Route
          path="/settings/design/builder"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <TemplateBuilder />
            </Suspense>
          }
        />
        <Route
          path="/settings/design/builder/:id"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <TemplateBuilder />
            </Suspense>
          }
        />

        {/* Regular Sidebar & Responsive Navigation Pages */}
        <Route
          path="*"
          element={
            <div style={{ display: 'flex', width: '100%', flex: 1 }}>
              {/* Desktop Fixed Sidebar */}
              <Sidebar />

              <main className="main-content">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Suspense fallback={<DashboardSkeleton />}>
                        <Dashboard />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/invoices"
                    element={
                      <Suspense fallback={<TableSkeleton />}>
                        <Invoices />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/invoices/new"
                    element={
                      <Suspense fallback={<SettingsSkeleton />}>
                        <InvoiceEdit />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/invoices/edit/:id"
                    element={
                      <Suspense fallback={<SettingsSkeleton />}>
                        <InvoiceEdit />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/agreements"
                    element={
                      <Suspense fallback={<AgreementSkeleton />}>
                        <Agreements />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/agreements/new"
                    element={
                      <Suspense fallback={<SettingsSkeleton />}>
                        <AgreementCreate />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/clients"
                    element={
                      <Suspense fallback={<TableSkeleton />}>
                        <Clients />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/billing"
                    element={
                      <Suspense fallback={<DashboardSkeleton />}>
                        <Billing />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Suspense fallback={<SettingsSkeleton />}>
                        <Settings />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/settings/design"
                    element={
                      <Suspense fallback={<SettingsSkeleton />}>
                        <BillDesign />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/settings/email"
                    element={
                      <Suspense fallback={<SettingsSkeleton />}>
                        <EmailDesign />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <Suspense fallback={<TableSkeleton />}>
                        <Admin />
                      </Suspense>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};

export default App;
