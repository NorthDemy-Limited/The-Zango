"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, X } from "lucide-react";
import { useOnlineStatus } from "@/lib/offline-sync";

export default function OfflineManager() {
  const { isOnline, wasOffline, pendingCount, isSyncing, syncNow, dismissWasOffline } = useOnlineStatus();
  const [dismissedOffline, setDismissedOffline] = useState(false);
  const [prevIsOnline, setPrevIsOnline] = useState(isOnline);

  // Reset dismiss state when online status transitions (standard React pattern)
  if (prevIsOnline !== isOnline) {
    setPrevIsOnline(isOnline);
    setDismissedOffline(false);
  }

  // Register service worker in production browser environments
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (reg.installing) {
            console.info("The Zango Service Worker installing...");
          }
        })
        .catch((err) => {
          console.warn("Service Worker registration skipped:", err);
        });
    }
  }, []);

  // If online and wasn't offline, render nothing
  if (isOnline && !wasOffline) {
    return null;
  }

  // If offline but user explicitly dismissed the floating pill
  if (!isOnline && dismissedOffline) {
    return null;
  }

  return (
    <aside
      aria-label="Network status"
      className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
    >
      {!isOnline ? (
        <div className="flex items-center space-x-3 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-0.5 pr-1">
            <p className="font-bold text-slate-100 flex items-center space-x-1.5">
              <span>Offline Mode Active</span>
              {pendingCount > 0 && (
                <span className="bg-amber-500/30 text-amber-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                  {pendingCount} queued
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-400">
              Reading from local cache. Edits saved locally.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
              title="Test connection"
            >
              Retry
            </button>
            <button
              onClick={() => setDismissedOffline(true)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : wasOffline ? (
        <div className="flex items-center space-x-3 bg-emerald-950/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-800/80 backdrop-blur-md text-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 pr-1">
            <p className="font-bold text-emerald-100">
              Connection Restored
            </p>
            <p className="text-[11px] text-emerald-300/80">
              {isSyncing
                ? "Synchronising offline queue with newsroom..."
                : pendingCount > 0
                ? `${pendingCount} offline items ready to transmit.`
                : "All drafts and dispatches synchronised."}
            </p>
          </div>
          <div className="flex items-center space-x-1.5 pl-2 border-l border-emerald-900/60">
            {pendingCount > 0 && (
              <button
                onClick={syncNow}
                disabled={isSyncing}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sync</span>
              </button>
            )}
            <button
              onClick={dismissWasOffline}
              className="text-emerald-400 hover:text-emerald-200 p-1 rounded-md"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
