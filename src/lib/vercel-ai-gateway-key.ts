"use client";

import { useSyncExternalStore } from "react";

const VERCEL_AI_GATEWAY_KEY_STORAGE_KEY = "tutor.vercel-ai-gateway-api-key";
const VERCEL_AI_GATEWAY_KEY_CHANGE_EVENT = "tutor:vercel-ai-gateway-key-change";
const MAX_VERCEL_AI_GATEWAY_KEY_LENGTH = 4_096;

function getSnapshot(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(VERCEL_AI_GATEWAY_KEY_STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === VERCEL_AI_GATEWAY_KEY_STORAGE_KEY) {
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

export function saveVercelAiGatewayApiKey(apiKey: string): string {
  const normalizedApiKey = apiKey.trim();
  if (!normalizedApiKey) {
    throw new Error("Enter a Vercel AI Gateway API key.");
  }
  if (normalizedApiKey.length > MAX_VERCEL_AI_GATEWAY_KEY_LENGTH) {
    throw new Error("The Vercel AI Gateway API key is too long.");
  }

  window.localStorage.setItem(VERCEL_AI_GATEWAY_KEY_STORAGE_KEY, normalizedApiKey);
  window.dispatchEvent(new Event(VERCEL_AI_GATEWAY_KEY_CHANGE_EVENT));
  return normalizedApiKey;
}

export function removeVercelAiGatewayApiKey(): void {
  window.localStorage.removeItem(VERCEL_AI_GATEWAY_KEY_STORAGE_KEY);
  window.dispatchEvent(new Event(VERCEL_AI_GATEWAY_KEY_CHANGE_EVENT));
}

export function useVercelAiGatewayApiKey(): {
  apiKey: string | null;
  isLoaded: boolean;
} {
  const apiKey = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  return { apiKey, isLoaded };
}
