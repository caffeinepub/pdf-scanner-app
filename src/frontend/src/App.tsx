import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Bell, Camera, Loader2, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { UserRole } from "./backend";
import { DocumentLibrary } from "./components/DocumentLibrary";
import { FoldersView } from "./components/FoldersView";
import { RecentScans } from "./components/RecentScans";
import { ScannerView } from "./components/ScannerView";
import { SettingsView } from "./components/SettingsView";
import { Sidebar, type ViewName } from "./components/Sidebar";
import { useActor } from "./hooks/useActor";
import {
  useAssignCallerUserRole,
  useGetCallerUserProfile,
  useGetCallerUserRole,
  useSaveUserProfile,
} from "./hooks/useDocuments";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

function AppContent() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return <LoginView login={login} loginStatus={loginStatus} />;
  }

  return <AuthenticatedApp />;
}

function LoginView({
  login,
  loginStatus,
}: { login: () => void; loginStatus: string }) {
  const isLoggingIn = loginStatus === "logging-in";
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-10 w-full max-w-sm shadow-card text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5">
          <Camera className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">ScanFlow</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Scan, store, and manage your documents in the cloud
        </p>
        <Button
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn}
          className="w-full gap-2"
          size="lg"
        >
          {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoggingIn ? "Signing in..." : "Sign in with Internet Identity"}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Powered by Internet Computer. No password needed.
        </p>
      </motion.div>
    </div>
  );
}

function AuthenticatedApp() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { actor } = useActor();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const { data: role } = useGetCallerUserRole();
  const saveProfile = useSaveUserProfile();
  const assignRole = useAssignCallerUserRole();
  const assignRoleMutate = assignRole.mutate;

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [currentView, setCurrentView] = useState<ViewName>("library");
  const [folderFilter, setFolderFilter] = useState<string | undefined>(
    undefined,
  );
  const [profileName, setProfileName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (role === UserRole.guest && identity && actor) {
      assignRoleMutate({
        principal: identity.getPrincipal(),
        role: UserRole.user,
      });
    }
  }, [role, identity, actor, assignRoleMutate]);

  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && profile === null;

  const handleProfileSetup = () => {
    saveProfile.mutate({ name: profileName.trim() || "User" });
  };

  const handleFolderSelect = (folder: string) => {
    setFolderFilter(folder);
    setCurrentView("library");
  };

  const pageTitle = {
    library: "Document Library",
    recent: "Recent Scans",
    folders: "Folders",
    scanner: "Scan Document",
    settings: "Settings",
  }[currentView];

  const userName = profile?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Profile Setup Modal */}
      <Dialog open={showProfileSetup}>
        <DialogContent
          data-ocid="profile.setup.dialog"
          className="[&>button]:hidden"
        >
          <DialogHeader>
            <DialogTitle>Welcome to ScanFlow!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            What should we call you?
          </p>
          <Label htmlFor="setup-name">Your Name</Label>
          <Input
            id="setup-name"
            data-ocid="profile.setup.input"
            placeholder="Enter your name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleProfileSetup()}
          />
          <Button
            data-ocid="profile.setup.submit_button"
            onClick={handleProfileSetup}
            disabled={saveProfile.isPending}
            className="w-full gap-2"
          >
            {saveProfile.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Get Started
          </Button>
        </DialogContent>
      </Dialog>

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <Sidebar
            currentView={currentView}
            onViewChange={(v) => {
              setCurrentView(v);
              setFolderFilter(undefined);
            }}
            darkMode={darkMode}
            onDarkModeToggle={() => setDarkMode((d) => !d)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="md:hidden p-1.5 rounded-lg hover:bg-muted"
                    data-ocid="nav.mobile.open_modal_button"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="p-0 w-60 bg-sidebar border-sidebar-border"
                  data-ocid="nav.mobile.sheet"
                >
                  <Sidebar
                    currentView={currentView}
                    onViewChange={(v) => {
                      setCurrentView(v);
                      setFolderFilter(undefined);
                      setMobileMenuOpen(false);
                    }}
                    darkMode={darkMode}
                    onDarkModeToggle={() => setDarkMode((d) => !d)}
                  />
                </SheetContent>
              </Sheet>
              <h1 className="text-lg font-semibold text-foreground">
                {pageTitle}
              </h1>
              {folderFilter && currentView === "library" && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>/</span>
                  <span className="text-foreground font-medium">
                    {folderFilter}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFolderFilter(undefined)}
                    className="ml-1 p-0.5 hover:bg-muted rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-ocid="header.notifications.button"
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <Bell className="w-5 h-5" />
              </button>
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Main scroll area */}
          <main className="flex-1 overflow-y-auto px-6 py-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {currentView === "library" && (
                  <>
                    <DocumentLibrary folderFilter={folderFilter} />
                    <RecentScans />
                  </>
                )}
                {currentView === "recent" && <RecentScans />}
                {currentView === "folders" && (
                  <FoldersView onFolderSelect={handleFolderSelect} />
                )}
                {currentView === "scanner" && (
                  <ScannerView onClose={() => setCurrentView("library")} />
                )}
                {currentView === "settings" && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Floating Scan Button */}
      {currentView !== "scanner" && (
        <button
          type="button"
          data-ocid="scanner.fab.primary_button"
          onClick={() => setCurrentView("scanner")}
          className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-border shadow-lg rounded-full px-5 py-3 text-sm font-semibold text-foreground hover:shadow-xl transition-shadow z-40"
        >
          <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </span>
          Scan Document
        </button>
      )}

      {/* Footer */}
      <footer className="sr-only">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
        >
          caffeine.ai
        </a>
      </footer>
    </>
  );
}
