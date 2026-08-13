"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "#/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "#/components/ui/input-group";
import {
  removeVercelAiGatewayApiKey,
  saveVercelAiGatewayApiKey,
  useVercelAiGatewayApiKey,
} from "#/lib/vercel-ai-gateway-key";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: "AI Settings | Tutor" }],
  }),
});

type SaveStatus = "idle" | "saved" | "removed" | "error";

function SettingsPage() {
  const { apiKey, isLoaded } = useVercelAiGatewayApiKey();
  const [draftApiKey, setDraftApiKey] = useState("");
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isLoaded) {
      setDraftApiKey(apiKey ?? "");
    }
  }, [apiKey, isLoaded]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      const savedApiKey = saveVercelAiGatewayApiKey(draftApiKey);
      setDraftApiKey(savedApiKey);
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not save the API key.");
    }
  }

  function handleRemove() {
    try {
      removeVercelAiGatewayApiKey();
      setDraftApiKey("");
      setIsKeyVisible(false);
      setSaveStatus("removed");
      setErrorMessage("");
    } catch {
      setSaveStatus("error");
      setErrorMessage("Could not remove the API key from this browser.");
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Button asChild size="icon-sm" variant="ghost">
            <Link aria-label="Back to notebooks" to="/">
              <ArrowLeftIcon />
            </Link>
          </Button>
          <div>
            <p className="text-sm font-semibold">Tutor</p>
            <p className="text-xs text-muted-foreground">Settings</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure the credential used for AI tutoring sessions on this device.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <KeyRoundIcon className="size-5" />
              </div>
              <CardTitle className="mt-2">Vercel AI Gateway</CardTitle>
              <CardDescription>
                A Vercel AI Gateway API key is required before you can use any tutor model.
              </CardDescription>
              <CardAction>
                <Badge variant={apiKey ? "secondary" : "outline"}>
                  {apiKey ? (
                    <>
                      <CheckCircle2Icon />
                      Configured
                    </>
                  ) : (
                    "Not configured"
                  )}
                </Badge>
              </CardAction>
            </CardHeader>

            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="vercel-ai-gateway-key">API key</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <KeyRoundIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      aria-describedby="vercel-ai-gateway-key-description"
                      aria-invalid={saveStatus === "error"}
                      autoComplete="off"
                      disabled={!isLoaded}
                      id="vercel-ai-gateway-key"
                      maxLength={4_096}
                      name="vercel-ai-gateway-key"
                      onChange={(event) => {
                        setDraftApiKey(event.target.value);
                        setSaveStatus("idle");
                        setErrorMessage("");
                      }}
                      placeholder="Paste your AI Gateway API key"
                      spellCheck={false}
                      type={isKeyVisible ? "text" : "password"}
                      value={draftApiKey}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        aria-label={isKeyVisible ? "Hide API key" : "Show API key"}
                        disabled={!draftApiKey}
                        onClick={() => setIsKeyVisible((isVisible) => !isVisible)}
                        size="icon-xs"
                      >
                        {isKeyVisible ? <EyeOffIcon /> : <EyeIcon />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription id="vercel-ai-gateway-key-description">
                    Create a key in the AI Gateway section of your Vercel dashboard. You can read
                    the{" "}
                    <a
                      href="https://vercel.com/docs/ai-gateway/authentication-and-byok"
                      rel="noreferrer"
                      target="_blank"
                    >
                      setup guide <ExternalLinkIcon className="inline size-3" />
                    </a>
                    .
                  </FieldDescription>
                  {saveStatus === "error" ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errorMessage}
                    </p>
                  ) : null}
                  {saveStatus === "saved" ? (
                    <p
                      className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400"
                      role="status"
                    >
                      <CheckCircle2Icon className="size-4" />
                      API key saved in this browser.
                    </p>
                  ) : null}
                  {saveStatus === "removed" ? (
                    <p className="text-sm text-muted-foreground" role="status">
                      API key removed from this browser.
                    </p>
                  ) : null}
                </Field>

                <Alert>
                  <ShieldCheckIcon />
                  <AlertTitle>Stored only on this device</AlertTitle>
                  <AlertDescription>
                    The key stays in this browser&apos;s local storage. It is sent to the server
                    only when you use an AI feature and is not saved in the app database.
                  </AlertDescription>
                </Alert>
              </FieldGroup>
            </CardContent>

            <CardFooter className="justify-between gap-3 border-t">
              <Button
                disabled={!apiKey || !isLoaded}
                onClick={handleRemove}
                type="button"
                variant="ghost"
              >
                Remove key
              </Button>
              <Button disabled={!draftApiKey.trim() || !isLoaded} type="submit">
                Save API key
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
