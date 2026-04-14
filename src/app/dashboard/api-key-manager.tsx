"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AiProvider } from "@/db/schema";

interface ExistingKey {
  id: string;
  provider: AiProvider;
  createdAt: Date;
}

const PROVIDERS: { value: AiProvider; label: string; placeholder: string }[] = [
  { value: "openai", label: "OpenAI", placeholder: "sk-proj-..." },
  { value: "anthropic", label: "Anthropic", placeholder: "sk-ant-..." },
  { value: "gemini", label: "Gemini", placeholder: "AIza..." },
];

export function ApiKeyManager({
  existingKeys,
}: {
  existingKeys: ExistingKey[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [provider, setProvider] = useState<AiProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedProvider = PROVIDERS.find((p) => p.value === provider)!;
  const hasKey = (p: AiProvider) => existingKeys.some((k) => k.provider === p);

  async function handleSave() {
    setError("");
    setSuccess("");
    if (!apiKey.trim()) {
      setError("Please enter an API key.");
      return;
    }
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save key.");
      return;
    }
    setApiKey("");
    setSuccess(`${selectedProvider.label} key saved and encrypted.`);
    startTransition(() => router.refresh());
  }

  async function handleDelete(p: AiProvider) {
    const res = await fetch(`/api/keys?provider=${p}`, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => router.refresh());
    }
  }

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[7px] font-black"
          style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
        >
          &#128274;
        </span>
        <h2 className="text-base font-bold">API Keys</h2>
      </div>
      <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        Encrypted with AES-256-GCM. Decrypted only in-memory during challenge generation.
        {" "}
        <a href="https://github.com" className="link-accent font-mono">
          Audit the code &#8599;
        </a>
      </p>

      {/* Existing keys */}
      {existingKeys.length > 0 && (
        <div className="mb-5 space-y-2">
          {existingKeys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg border px-4 py-2.5"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--color-neon)", boxShadow: "0 0 4px var(--color-neon)" }}
                />
                <span className="font-mono text-xs font-medium">
                  {PROVIDERS.find((p) => p.value === k.provider)?.label}
                </span>
              </div>
              <button
                onClick={() => handleDelete(k.provider)}
                className="btn-danger rounded-md px-2 py-0.5 font-mono text-[11px] font-medium transition-all"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Provider tabs */}
      <div className="flex gap-1.5 mb-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.value}
            onClick={() => { setProvider(p.value); setError(""); setSuccess(""); }}
            data-active={String(provider === p.value)}
            className="tab-btn rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all"
          >
            {p.label}{hasKey(p.value) && " ✓"}
          </button>
        ))}
      </div>

      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={selectedProvider.placeholder}
        className="input-field w-full rounded-lg border px-3 py-2.5 font-mono text-xs transition-colors focus:outline-none"
      />

      {error && <p className="mt-2 font-mono text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
      {success && <p className="mt-2 font-mono text-xs" style={{ color: "var(--color-neon)" }}>{success}</p>}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="btn-secondary mt-3 rounded-lg px-4 py-2 font-mono text-xs font-bold transition-all"
      >
        {hasKey(provider) ? "Update" : "Save"} {selectedProvider.label} Key
      </button>
    </div>
  );
}
