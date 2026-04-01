import { renderWidget, usePlugin } from "@remnote/plugin-sdk";
import React, { useState, useRef, useEffect } from "react";
import { fetchWordFromUrl } from "../lib/scraper";
import { createMultipleWordRems } from "../lib/rem-creator";
import { log } from "../lib/logging";

function CambridgeUrlInput() {
  const plugin = usePlugin();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!trimmed.includes("dictionary.cambridge.org")) {
      setStatus("Please provide a valid Cambridge Dictionary URL.");
      return;
    }

    setIsLoading(true);
    setStatus("Fetching definitions...");

    const entries = await fetchWordFromUrl(trimmed);
    if (entries.length === 0) {
      setStatus("No definitions found. Make sure the URL contains a word slug, e.g. /dictionary/english/cranky");
      setIsLoading(false);
      return;
    }

    setStatus(`Found ${entries.length} definition(s). Importing...`);
    const count = await createMultipleWordRems(plugin, entries);
    log(plugin, `Imported ${count} definition(s) from URL.`, true);
    await plugin.widget.closePopup();
  };

  return (
    <div className="flex flex-col p-4 gap-4 rn-clr-background">
      <div className="text-2xl font-bold rn-clr-content-primary">
        Cambridge: Import from URL
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="url-input" className="font-semibold rn-clr-content-primary">
            Cambridge Dictionary URL:
          </label>
          <input
            ref={inputRef}
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setStatus("");
            }}
            placeholder="https://dictionary.cambridge.org/dictionary/english/cranky"
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
            className="px-4 py-2 rounded rn-clr-content-secondary border-solid border rn-clr-border-opaque"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="px-4 py-2 font-semibold rounded"
            style={{
              backgroundColor: isLoading || !url.trim() ? "#93C5FD" : "#3B82F6",
              color: "white",
              border: "none",
              cursor: isLoading || !url.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Importing..." : "Import"}
          </button>
        </div>
      </form>
    </div>
  );
}

renderWidget(CambridgeUrlInput);
