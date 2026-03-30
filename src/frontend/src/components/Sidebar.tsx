import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Camera, Clock, Folder, Library, Moon, Settings } from "lucide-react";

export type ViewName =
  | "library"
  | "recent"
  | "folders"
  | "scanner"
  | "settings";

interface SidebarProps {
  currentView: ViewName;
  onViewChange: (view: ViewName) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

const navItems: { id: ViewName; label: string; icon: React.ElementType }[] = [
  { id: "library", label: "Library", icon: Library },
  { id: "recent", label: "Recent Scans", icon: Clock },
  { id: "folders", label: "Folders", icon: Folder },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  currentView,
  onViewChange,
  darkMode,
  onDarkModeToggle,
}: SidebarProps) {
  return (
    <aside className="flex flex-col w-60 shrink-0 bg-sidebar h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">
          ScanFlow
        </span>
      </div>

      {/* Scan Now CTA */}
      <div className="px-4 pt-4">
        <button
          type="button"
          data-ocid="scanner.open_modal_button"
          onClick={() => onViewChange("scanner")}
          className="w-full flex items-center gap-2.5 bg-primary/90 hover:bg-primary text-white rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
        >
          <Camera className="w-4 h-4" />
          Scan Now
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 pt-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-ocid={`nav.${item.id}.link`}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-white"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="px-5 py-5 border-t border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-sidebar-foreground/60" />
          <span className="text-sidebar-foreground/70 text-sm">Dark Mode</span>
        </div>
        <Switch
          data-ocid="settings.darkmode.switch"
          checked={darkMode}
          onCheckedChange={onDarkModeToggle}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </aside>
  );
}
