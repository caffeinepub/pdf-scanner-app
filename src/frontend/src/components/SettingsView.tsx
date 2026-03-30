import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Save, User } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useGetCallerUserProfile,
  useSaveUserProfile,
} from "../hooks/useDocuments";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function SettingsView() {
  const { clear, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveUserProfile();
  const [name, setName] = useState("");

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  const handleSave = () => {
    saveProfile.mutate({ name: name.trim() || "User" });
  };

  return (
    <section className="max-w-xl">
      <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" /> Profile
          </CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Display Name</Label>
            <Input
              id="profile-name"
              data-ocid="settings.name.input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {identity && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Principal</Label>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {identity.getPrincipal().toString()}
              </p>
            </div>
          )}
          <Button
            data-ocid="settings.save.submit_button"
            onClick={handleSave}
            disabled={saveProfile.isPending || isLoading}
            className="w-full gap-2"
          >
            {saveProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card>
        <CardContent className="pt-6">
          <Button
            data-ocid="settings.logout.button"
            variant="destructive"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
