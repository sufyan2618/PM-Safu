import { Menu } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { IconButton } from '@/components/ui/IconButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useUiStore } from '@/store/uiStore';

export function Topbar() {
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-subtle bg-surface/90 px-4 backdrop-blur-md lg:px-6">
      <IconButton
        label="Open menu"
        icon={<Menu size={20} strokeWidth={1.5} />}
        className="lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
      />
      <SearchBar />
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
