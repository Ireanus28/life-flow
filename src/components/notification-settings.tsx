"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Preferences = {
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function NotificationSettings({ initialPreferences }: { initialPreferences: Preferences }) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [subscribing, setSubscribing] = useState(false);

  async function updatePrefs(patch: Partial<Preferences>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function enablePush() {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications aren't supported in this browser");
      return;
    }
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const keyRes = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        toast.error("Push isn't configured on the server yet");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      await updatePrefs({ notifyPush: true });
      toast.success("Push notifications enabled");
    } catch {
      toast.error("Couldn't enable push notifications");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-medium text-foreground">Notification settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose how LifeFlow reaches you.</p>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-in-app">In-app</Label>
            <Switch
              id="notify-in-app"
              checked={prefs.notifyInApp}
              onCheckedChange={(checked: boolean) => updatePrefs({ notifyInApp: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-push">Push notifications</Label>
            {prefs.notifyPush ? (
              <Switch
                id="notify-push"
                checked={prefs.notifyPush}
                onCheckedChange={(checked: boolean) => updatePrefs({ notifyPush: checked })}
              />
            ) : (
              <Button type="button" size="sm" variant="outline" disabled={subscribing} onClick={enablePush}>
                Enable
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-email">
              Email <span className="text-xs text-muted-foreground">(coming soon)</span>
            </Label>
            <Switch
              id="notify-email"
              checked={prefs.notifyEmail}
              onCheckedChange={(checked: boolean) => updatePrefs({ notifyEmail: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-sms">
              SMS <span className="text-xs text-muted-foreground">(coming soon)</span>
            </Label>
            <Switch
              id="notify-sms"
              checked={prefs.notifySms}
              onCheckedChange={(checked: boolean) => updatePrefs({ notifySms: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quiet hours</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Input
            type="time"
            aria-label="Quiet hours start"
            value={prefs.quietHoursStart ?? ""}
            onChange={(e) => updatePrefs({ quietHoursStart: e.target.value || null })}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="time"
            aria-label="Quiet hours end"
            value={prefs.quietHoursEnd ?? ""}
            onChange={(e) => updatePrefs({ quietHoursEnd: e.target.value || null })}
            className="w-32"
          />
        </CardContent>
      </Card>
    </div>
  );
}
