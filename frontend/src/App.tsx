import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from '@/routes/AppRouter';
import { ToastViewport } from '@/components/ui/Toast/Toast';
import { queryClient } from '@/api/queryClient';
import { useThemeStore } from '@/store/themeStore';

function App() {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <ToastViewport />
    </QueryClientProvider>
  );
}

export default App;
