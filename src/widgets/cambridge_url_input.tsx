import { renderWidget, usePlugin } from "@remnote/plugin-sdk";
import React, { useState, useRef, useEffect } from "react";
import { fetchWordFromUrl } from "../lib/scraper";
import { PICKER_KEY } from "../lib/constants";

function CambridgeUrlInput() {
  const plugin = usePlugin();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setStatus("Fetching definitions…");

    const entries = await fetchWordFromUrl(trimmed);

    if (entries.length === 0) {
      setStatus(
        trimmed.includes("cambridge.org")
          ? "No definitions found. Make sure the URL contains a valid word path, e.g. /dictionary/english/cranky"
          : `No definitions found for "${trimmed}".`
      );
      setIsLoading(false);
      return;
    }

    setStatus(`Found ${entries.length} definition(s). Opening picker…`);

    // Pass entries to the picker via session storage
    await plugin.storage.setSession(PICKER_KEY, JSON.stringify(entries));

    // Close the URL input popup and open the picker
    await plugin.widget.closePopup();
    await plugin.widget.openPopup("cambridge_definition_picker");
  };

  const isCambridgeUrl = input.includes("dictionary.cambridge.org");
  const placeholder = isCambridgeUrl
    ? "https://dictionary.cambridge.org/dictionary/english/cranky"
    : "Type a word (e.g. cranky) or paste a Cambridge URL";

  return (
    <div className="flex flex-col p-4 gap-4 rn-clr-background">
      <div className="text-xl font-bold rn-clr-content-primary">
        Look Up a Word
      </div>
      <div className="text-sm rn-clr-content-secondary">
        Enter an English word <em>or</em> paste a Cambridge Dictionary URL.
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="word-or-url-input" className="font-semibold rn-clr-content-primary text-sm">
            Word or URL:
          </label>
          <input
            ref={inputRef}
            id="word-or-url-input"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setStatus("");
            }}
            placeholder={placeholder}
            disabled={isLoading}
            className="px-3 py-2 rounded text-sm rn-clr-content-primary rn-clr-background-main border-solid border rn-clr-border-opaque"
            style={{ outline: "none" }}
          />
          {status && (
            <div className="text-sm rn-clr-content-secondary">{status}</div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => plugin.widget.closePopup()}
            disabled={isLoading}
            className="px-4 py-2 rounded text-sm rn-clr-content-secondary"
            style={{ border: "1px solid var(--rn-clr-border-opaque)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 font-semibold rounded text-sm"
            style={{
              background: isLoading || !input.trim() ? "#93C5FD" : "#3B82F6",
              color: "white",
              border: "none",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Fetching…" : "Look Up"}
          </button>
        </div>
      </form>
    </div>
  );
}

renderWidget(CambridgeUrlInput);
