import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from '@/routes/AppRouter';
import { ToastViewport } from '@/components/ui/Toast/Toast';
import { RouteFallback } from '@/routes/RouteFallback';
import { queryClient } from '@/api/queryClient';
import { authService } from '@/api/services/auth.service';
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
        if (res.type === 'user' && res.user && res.company) {
          setSession({ user: res.user, token, company: res.company });
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setHydrating(false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {isHydrating ? <RouteFallback /> : <AppRouter />}
      <ToastViewport />
    </QueryClientProvider>
  );
}

export default App;
