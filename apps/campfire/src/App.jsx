// © 2025 Studio Tak. All rights reserved.
// This file is part of a proprietary software project. Do not distribute.
import React from "react";
import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  HashRouter,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import Login from "./Login";
import SignUpStepper from "./SignUpStepper.tsx";
import ReviewRoute from "./ReviewRoute";
import CreateAdGroup from "./CreateAdGroup";
import AdGroupDetail from "./AdGroupDetail";
import DesignerDashboard from "./DesignerDashboard";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";
import AdminAdGroups from "./AdminAdGroups";
import AgencyDashboard from "./AgencyDashboard";
import Request from "./Request";
import BrandSetup from "./BrandSetup";
import AccountSettings from "./AccountSettings";
import DesignerNotifications from "./DesignerNotifications";
import DesignerAccountSettings from "./DesignerAccountSettings";
import AdminAccountSettings from "./AdminAccountSettings";
import AgencyAccountSettings from "./AgencyAccountSettings";
import AdminAccountForm from "./AdminAccountForm";
import AdminAccounts from "./AdminAccounts";
import RoleGuard from "./RoleGuard";
import useUserRole from "./useUserRole";
import useAdminClaim from "./useAdminClaim";
import AdminBrandForm from "./AdminBrandForm";
import AdminBrands from "./AdminBrands";
import ManageMfa from "./ManageMfa";
import RequireMfa from "./RequireMfa";
import SiteSettings from "./SiteSettings";
import RoleSidebar from "./RoleSidebar";
import AgencyThemeSettings from "./AgencyThemeSettings";
import AgencyBrands from "./AgencyBrands";
import AgencyAdGroups from "./AgencyAdGroups";
import useTheme from "./useTheme";
import debugLog from "./utils/debugLog";
import useSiteSettings from "./useSiteSettings";
import useAgencyTheme from "./useAgencyTheme";
import LoadingOverlay from "./LoadingOverlay";
import { DEFAULT_LOGO_URL } from "./constants";

// Use HashRouter when the app is opened from the filesystem so routes work
const RouterImpl =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? HashRouter
    : BrowserRouter;

const ThemeWatcher = () => {
  useTheme();
  return null;
};

const RouteLogger = ({ name, children }) => {
  debugLog('Render route', name);
  return children;
};

const App = () => {
    useEffect(() => {
    // ✅ Unhide app by removing theme-related classes
    document.body.classList.remove("pre-theme");
    document.documentElement.classList.remove("loading");
  }, []);

  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    debugLog('Auth listener mounted');
    const unsub = onAuthStateChanged(auth, (u) => {
      debugLog('Auth state changed', u);
      setUser(u);
      setLoading(false);
    });
    return () => {
      debugLog('Auth listener removed');
      unsub();
    };
  }, []);

  const {
    role: dbRole,
    brandCodes,
    agencyId,
    loading: roleLoading,
  } = useUserRole(user?.uid);
  const { isAdmin, loading: adminLoading } = useAdminClaim();
  const { settings, loading: settingsLoading } = useSiteSettings(!agencyId);
  const { agency, loading: agencyLoading } = useAgencyTheme(agencyId);
  const [logoLoaded, setLogoLoaded] = React.useState(false);

  React.useEffect(() => {
  const url = agencyId ? agency.logoUrl || DEFAULT_LOGO_URL : settings.logoUrl || DEFAULT_LOGO_URL;
  console.log("🎨 Logo URL being loaded:", url);

  if (!url) {
    setLogoLoaded(true);
    return;
  }

  const img = new Image();

  const fallback = () => {
    console.warn("⚠️ Logo failed to load, falling back.");
    setLogoLoaded(true);
  };

  img.onload = () => {
    console.log("✅ Logo loaded");
    setLogoLoaded(true);
  };

  img.onerror = fallback;

  // Timeout fallback just in case the request stalls
  setTimeout(fallback, 3000);

  img.src = url;
}, [agency.logoUrl, settings.logoUrl, agencyId]);


  const ready =
    !loading &&
    !roleLoading &&
    !adminLoading &&
    !settingsLoading &&
    !agencyLoading &&
    logoLoaded;

  debugLog('App state', {
    loading,
    roleLoading,
    adminLoading,
    settingsLoading,
    agencyLoading,
    logoLoaded,
    ready,
  });

  React.useEffect(() => {
    if (ready) {
      document.body.classList.remove('pre-theme');
    }
  }, [ready]);



  const signedIn = user && !user.isAnonymous;
  const role = isAdmin ? 'admin' : dbRole;
  const defaultPath = signedIn
    ? role === 'agency'
      ? `/agency/dashboard?agencyId=${agencyId}`
      : `/dashboard/${role}`
    : '/login';

  debugLog('Routing info', { signedIn, role, defaultPath });
  if (signedIn && !role) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center">
        No role assigned to this account. Please contact support.
      </div>
    );
  }

  if (!ready) {
    return <LoadingOverlay visible />;
  }

return (
  <RouterImpl basename={import.meta.env.BASE_URL}>
    <ThemeWatcher />
    <RequireMfa user={user} role={role}>
      <div className="min-h-screen flex">
        {signedIn && (
          <RoleSidebar role={role} isAdmin={isAdmin} agencyId={agencyId} />
        )}
        <div
          className={`flex flex-col flex-grow box-border min-w-0 max-w-full ${
            signedIn ? 'md:pl-[250px]' : ''
          }`}
        >
          <div className="flex-grow">
            <Routes>
              <Route
                path="/login"
                element={
                  <div style={{ padding: '2rem', color: 'white', background: '#222' }}>
                    <h1>🔐 Login page route</h1>
                    <p>This means routing to /login works and the router is matching correctly.</p>
                  </div>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </RequireMfa>
  </RouterImpl>
);
};

export default App;