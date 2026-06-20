import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar/Sidebar';
import { Topbar } from './Topbar/Topbar';
import { Drawer } from '@/components/ui/Drawer';
import { useUiStore } from '@/store/uiStore';
import { useIsDesktop } from '@/hooks/useMediaQuery';

export function AppShell() {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {isDesktop && (
        <div className="shrink-0">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
      )}

      <Drawer
        open={!isDesktop && mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        side="left"
        width={280}
      >
        <div className="-mx-5 -my-4 h-full">
          <Sidebar
            collapsed={false}
            showCollapseToggle={false}
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </div>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
