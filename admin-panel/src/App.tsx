import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from '@/routes/AppRouter';
import { ToastViewport } from '@/components/ui/Toast/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import { queryClient } from '@/api/queryClient';
import { authService } from '@/api/services';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    const { token, setSession, setHydrating, logout } = useAuthStore.getState();
    if (!token) {
      setHydrating(false);
      return;
    }
    authService
      .me()
      .then((res) => {
        if (res.type === 'super_admin' && res.superAdmin) {
          setSession({ superAdmin: res.superAdmin, token });
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setHydrating(false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {isHydrating ? (
          <div className="min-h-screen bg-canvas">
            <PageLoader label="Restoring session…" />
          </div>
        ) : (
          <AppRouter />
        )}
        <ToastViewport />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
