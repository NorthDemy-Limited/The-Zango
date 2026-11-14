"use client";

import { useState, useEffect, useCallback } from "react";

export interface OfflineSubmissionItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  authorEmail: string;
  coverImage: string;
  tags: string[];
  wordCount: number;
  readTime: string;
  queuedAt: string;
  status: "queued" | "syncing" | "synced" | "failed";
  retryCount: number;
  error?: string;
  editingSubmissionId?: string | null;
}

export const OFFLINE_QUEUE_KEY = "thezango_offline_sync_queue";
export const WRITER_DRAFT_KEY = "thezango_writer_draft";
export const ADMIN_DRAFT_KEY = "thezango_admin_article_draft";
export const CACHED_ARTICLES_KEY = "thezango_cached_articles";
export const CACHED_SUBMISSIONS_KEY = "thezango_cached_submissions";

/**
 * Safely retrieve queued offline submissions from localStorage
 */
export function getOfflineQueue(): OfflineSubmissionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to read offline queue from storage:", err);
    return [];
  }
}

/**
 * Save the entire offline queue to localStorage and notify listeners
 */
function saveOfflineQueue(queue: OfflineSubmissionItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent("thezango_offline_queue_changed", { detail: { count: queue.length } }));
  } catch (err) {
    console.error("Failed to write to offline queue storage:", err);
  }
}

/**
 * Add a pitch or revised manuscript to the offline queue
 */
export function queueOfflineSubmission(
  item: Omit<OfflineSubmissionItem, "id" | "queuedAt" | "status" | "retryCount"> & { id?: string }
): OfflineSubmissionItem {
  const queue = getOfflineQueue();
  const newItem: OfflineSubmissionItem = {
    id: item.id || `offline-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: item.title,
    excerpt: item.excerpt,
    content: item.content,
    category: item.category,
    authorName: item.authorName,
    authorEmail: item.authorEmail,
    coverImage: item.coverImage,
    tags: item.tags,
    wordCount: item.wordCount,
    readTime: item.readTime,
    queuedAt: new Date().toISOString(),
    status: "queued",
    retryCount: 0,
    editingSubmissionId: item.editingSubmissionId || null,
  };

  const existingIdx = queue.findIndex((q) => q.id === newItem.id);
  if (existingIdx >= 0) {
    queue[existingIdx] = newItem;
  } else {
    queue.push(newItem);
  }

  saveOfflineQueue(queue);
  return newItem;
}

/**
 * Remove an item from the offline queue
 */
export function removeOfflineSubmission(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveOfflineQueue(queue);
}

/**
 * Clear the offline queue
 */
export function clearOfflineQueue(): void {
  saveOfflineQueue([]);
}

/**
 * Count how many items are awaiting sync
 */
export function getOfflineQueueCount(): number {
  return getOfflineQueue().filter((item) => item.status !== "synced").length;
}

/**
 * Replay/sync all pending items in the offline queue to the newsroom server
 */
export async function syncOfflineQueue(
  onProgress?: (synced: number, total: number) => void
): Promise<{ success: number; failed: number; items: OfflineSubmissionItem[] }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { success: 0, failed: 0, items: [] };
  }

  const queue = getOfflineQueue();
  const pending = queue.filter((item) => item.status !== "synced");
  if (pending.length === 0) {
    return { success: 0, failed: 0, items: [] };
  }

  let successCount = 0;
  let failedCount = 0;
  const updatedQueue = [...queue];

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    const indexInMain = updatedQueue.findIndex((q) => q.id === item.id);
    if (indexInMain === -1) continue;

    try {
      updatedQueue[indexInMain].status = "syncing";
      saveOfflineQueue(updatedQueue);

      const payload = {
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        category: item.category,
        authorName: item.authorName,
        authorEmail: item.authorEmail,
        coverImage: item.coverImage,
        tags: item.tags,
        wordCount: item.wordCount,
        readTime: item.readTime,
      };

      const res = await fetch("/api/writer/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        successCount++;
        // Remove successfully transmitted item from queue
        updatedQueue.splice(indexInMain, 1);
        saveOfflineQueue(updatedQueue);

        window.dispatchEvent(
          new CustomEvent("thezango_offline_synced", {
            detail: { item, success: true },
          })
        );
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err: unknown) {
      failedCount++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (indexInMain >= 0 && indexInMain < updatedQueue.length) {
        updatedQueue[indexInMain].status = "failed";
        updatedQueue[indexInMain].retryCount += 1;
        updatedQueue[indexInMain].error = errorMessage;
      }
      saveOfflineQueue(updatedQueue);
    }

    if (onProgress) {
      onProgress(successCount, pending.length);
    }
  }

  return { success: successCount, failed: failedCount, items: getOfflineQueue() };
}

/**
 * Generic Offline Draft helpers
 */
export function saveOfflineDraft<T extends Record<string, unknown>>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        ...data,
        savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        savedTimestamp: Date.now(),
      })
    );
  } catch (err) {
    console.warn(`Could not save draft to ${key}:`, err);
  }
}

export function loadOfflineDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearOfflineDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * React Hook for tracking online status and offline synchronization queue
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(() => getOfflineQueueCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedCount, setLastSyncedCount] = useState<number>(0);

  const refreshCount = useCallback(() => {
    setPendingCount(getOfflineQueueCount());
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineQueue();
      if (res.success > 0) {
        setLastSyncedCount(res.success);
      }
    } finally {
      setIsSyncing(false);
      refreshCount();
    }
  }, [isSyncing, refreshCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Automatically attempt background sync when network returns
      void triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    const handleQueueChange = () => {
      refreshCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("thezango_offline_queue_changed", handleQueueChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("thezango_offline_queue_changed", handleQueueChange);
    };
  }, [refreshCount, triggerSync]);

  return {
    isOnline,
    wasOffline,
    pendingCount,
    isSyncing,
    lastSyncedCount,
    syncNow: triggerSync,
    clearQueue: clearOfflineQueue,
    dismissWasOffline: () => setWasOffline(false),
  };
}
