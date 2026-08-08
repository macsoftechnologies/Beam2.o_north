import React, { useEffect, useState } from 'react';

export function SSOHandler({ children }) {
  const initialSsoToken = new URLSearchParams(window.location.search).get('sso_token');
  const [verifying, setVerifying] = useState(Boolean(initialSsoToken));

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('sso_token');

    if (!ssoToken) {
      setVerifying(false);
      return;
    }

    const performSsoLogin = async () => {
      const baseUrls = [
        import.meta.env.VITE_API_BASE_URL,
        'http://api.beam.safesiteworks.com/m3north/auth/sso-login',
        'http://api.beam.safesiteworks.com/m3north/api/auth/sso-login',
      ].filter(Boolean);

      let success = false;
      let data = null;

      for (const baseUrl of baseUrls) {
        try {
          const endpoint = baseUrl.endsWith('/') ? `${baseUrl}auth/sso-login` : `${baseUrl}/auth/sso-login`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sso_token: ssoToken }),
          });

          if (response.ok) {
            data = await response.json();
            if (data && (data.token || data.access_token)) {
              success = true;
              break;
            }
          }
        } catch (err) {
          console.warn(`SSO attempt failed for ${baseUrl}:`, err.message);
        }
      }

      if (success && data) {
        const validToken = data.token || data.access_token;

        // Set all required portal localStorage keys BEFORE ProtectedRoute runs
        localStorage.setItem('m3north_token', validToken);
        localStorage.setItem('m3north_access_token', validToken);
        localStorage.setItem('m3north_UserType', 'SuperAdmin');
        localStorage.setItem('m3north_isLoggedIn', 'true');
        localStorage.setItem(
          'm3north_user',
          JSON.stringify({
            id: data.id || 1,
            username: data.username || 'superadmin',
            userType: 'SuperAdmin',
            role: 'SuperAdmin',
            empId: data.empId || 1,
          })
        );

        // Clean SSO token from URL query string
        const urlWithoutToken = new URL(window.location.href);
        urlWithoutToken.searchParams.delete('sso_token');
        window.history.replaceState({}, document.title, urlWithoutToken.pathname + urlWithoutToken.search);

        // Allow render of children now that localStorage is populated
        setVerifying(false);
      } else {
        console.error('SSO Authentication could not be completed with available backends.');
        setVerifying(false);
      }
    };

    performSsoLogin();
  }, []);

  if (verifying) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#38bdf8',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: '4px solid #38bdf8',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#f8fafc' }}>Authenticating via Superadmin SSO...</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Verifying security credentials & populating session.</p>
        </div>
      </div>
    );
  }

  return children;
}
