"use client";

import { useEffect, useSyncExternalStore } from "react";
import { authClient } from "./auth/auth-client";

const VERCEL_AI_GATEWAY_KEY_STORAGE_KEY = "tutor.vercel-ai-gateway-api-key";
const VERCEL_AI_GATEWAY_KEY_CHANGE_EVENT = "tutor:vercel-ai-gateway-key-change";
const MAX_VERCEL_AI_GATEWAY_KEY_LENGTH = 4_096;

function readStoredKey(): { userId: string; apiKey: string } | null {
  const value: unknown = JSON.parse(
    window.localStorage.getItem(VERCEL_AI_GATEWAY_KEY_STORAGE_KEY) ?? "null",
  );
  if (
    value &&
    typeof value === "object" &&
    "userId" in value &&
    typeof value.userId === "string" &&
    "apiKey" in value &&
    typeof value.apiKey === "string"
  ) {
    return { userId: value.userId, apiKey: value.apiKey };
  }
  return null;
}

function getSnapshot(userId: string | null): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = readStoredKey();
    return userId && stored?.userId === userId ? stored.apiKey : null;
  } catch {
    return null;
  }
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === VERCEL_AI_GATEWAY_KEY_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(VERCEL_AI_GATEWAY_KEY_CHANGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(VERCEL_AI_GATEWAY_KEY_CHANGE_EVENT, handleLocalChange);
  };
}

function subscribeToHydration(): () => void {
  return () => undefined;
}

function saveVercelAiGatewayApiKey(apiKey: string, userId: string | null): string {
  if (!userId) throw new Error("Sign in before saving an API key.");
  const normalizedApiKey = apiKey.trim();
  if (!normalizedApiKey) {
    throw new Error("Enter a Vercel AI Gateway API key.");
  }
  if (normalizedApiKey.length > MAX_VERCEL_AI_GATEWAY_KEY_LENGTH) {
    throw new Error("The Vercel AI Gateway API key is too long.");
  }

  window.localStorage.setItem(
    VERCEL_AI_GATEWAY_KEY_STORAGE_KEY,
    JSON.stringify({ userId, apiKey: normalizedApiKey }),
  );
  window.dispatchEvent(new Event(VERCEL_AI_GATEWAY_KEY_CHANGE_EVENT));
  return normalizedApiKey;
}

export function removeVercelAiGatewayApiKey(): void {
  window.localStorage.removeItem(VERCEL_AI_GATEWAY_KEY_STORAGE_KEY);
  window.dispatchEvent(new Event(VERCEL_AI_GATEWAY_KEY_CHANGE_EVENT));
}

// Mount in the root shell to clear credentials on logout/account changes even
// when neither Settings nor chat is mounted. Legacy keys have no trusted owner.
export function VercelAiGatewayKeySessionSync() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (isPending) return;
    try {
      let owner: string | undefined;
      try {
        owner = readStoredKey()?.userId;
      } catch {
        // Legacy plaintext and malformed records must be discarded.
      }
      if (!userId || owner !== userId) removeVercelAiGatewayApiKey();
    } catch {
      // Storage can be disabled; reads fail closed and logout must still work.
    }
  }, [isPending, userId]);
  return null;
}

export function useVercelAiGatewayApiKey(): {
  apiKey: string | null;
  isLoaded: boolean;
  saveApiKey: (apiKey: string) => string;
} {
  const { data: session, isPending } = authClient.useSession();
  const userId = isPending ? null : (session?.user.id ?? null);
  const apiKey = useSyncExternalStore(
    subscribe,
    () => getSnapshot(userId),
    () => null,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  return {
    apiKey,
    isLoaded: isHydrated && !isPending,
    saveApiKey: (value) => saveVercelAiGatewayApiKey(value, userId),
  };
}
