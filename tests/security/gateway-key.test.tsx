// @vitest-environment jsdom
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const auth = vi.hoisted(() => ({
  data: null as { user: { id: string } } | null,
  isPending: false,
}));
vi.mock("../../src/lib/auth/auth-client", () => ({ authClient: { useSession: () => auth } }));
import {
  removeVercelAiGatewayApiKey,
  useVercelAiGatewayApiKey,
  VercelAiGatewayKeySessionSync,
} from "../../src/lib/vercel-ai-gateway-key";

const storageKey = "tutor.vercel-ai-gateway-api-key";
function wrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <VercelAiGatewayKeySessionSync />
      {children}
    </>
  );
}

describe("account-bound AI Gateway credentials", () => {
  beforeEach(() => {
    localStorage.clear();
    auth.data = { user: { id: "user-a" } };
    auth.isPending = false;
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("retains the current account's key across remounts", () => {
    const first = renderHook(useVercelAiGatewayApiKey, { wrapper });
    act(() => {
      first.result.current.saveApiKey("  synthetic-key-a  ");
    });
    expect(first.result.current.apiKey).toBe("synthetic-key-a");
    first.unmount();
    const second = renderHook(useVercelAiGatewayApiKey, { wrapper });
    expect(second.result.current.apiKey).toBe("synthetic-key-a");
  });

  it("does not expose the previous user's key during account changes", () => {
    const { result, rerender } = renderHook(useVercelAiGatewayApiKey, { wrapper });
    act(() => {
      result.current.saveApiKey("synthetic-key-a");
    });
    auth.data = { user: { id: "user-b" } };
    rerender();
    expect(result.current.apiKey).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
    act(() => {
      result.current.saveApiKey("synthetic-key-b");
    });
    expect(result.current.apiKey).toBe("synthetic-key-b");
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({
      userId: "user-b",
      apiKey: "synthetic-key-b",
    });
  });

  it("clears keys on logout without Settings or chat mounted", () => {
    localStorage.setItem(storageKey, JSON.stringify({ userId: "user-a", apiKey: "synthetic-key" }));
    const { rerender } = render(<VercelAiGatewayKeySessionSync />);
    auth.data = null;
    rerender(<VercelAiGatewayKeySessionSync />);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it("discards legacy plaintext keys of unknown ownership", () => {
    localStorage.setItem(storageKey, "legacy-unknown-owner");
    const { result } = renderHook(useVercelAiGatewayApiKey, { wrapper });
    expect(result.current.apiKey).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it("hides keys and prevents saving before authentication resolves", () => {
    localStorage.setItem(storageKey, JSON.stringify({ userId: "user-a", apiKey: "synthetic-key" }));
    auth.isPending = true;
    const { result } = renderHook(useVercelAiGatewayApiKey, { wrapper });
    expect(result.current.apiKey).toBeNull();
    expect(result.current.isLoaded).toBe(false);
    expect(() => result.current.saveApiKey("replacement")).toThrow("Sign in");
    expect(localStorage.getItem(storageKey)).toContain("synthetic-key");
  });

  it("updates readers when the sign-out action removes the key", () => {
    const { result } = renderHook(useVercelAiGatewayApiKey, { wrapper });
    act(() => {
      result.current.saveApiKey("synthetic-key");
    });
    act(() => {
      removeVercelAiGatewayApiKey();
    });
    expect(result.current.apiKey).toBeNull();
  });

  it("fails closed if browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    const { result } = renderHook(useVercelAiGatewayApiKey, { wrapper });
    expect(result.current.apiKey).toBeNull();
  });
});
