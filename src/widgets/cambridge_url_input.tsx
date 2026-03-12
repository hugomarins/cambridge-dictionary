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
    if (!url.trim()) return;

    if (!url.includes("dictionary.cambridge.org")) {
      setStatus("Please provide a valid Cambridge Dictionary URL.");
      return;
    }

    setIsLoading(true);
    setStatus("Fetching definitions from URL...");

    try {
      const entries = await fetchWordFromUrl(url.trim());
      if (entries.length === 0) {
        setStatus("No definitions found at that URL.");
        setIsLoading(false);
        return;
      }

      setStatus(`Found ${entries.length} definition(s). Importing...`);
      const count = await createMultipleWordRems(plugin, entries);
      log(plugin, `Imported ${count} definition(s) from URL.`, true);
      await plugin.widget.closePopup();
    } catch (error) {
      setStatus(`Error: ${error}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="text-2xl font-bold">Cambridge: Import from URL</div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="url-input" className="font-semibold">
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit(e);
            }}
            placeholder="https://dictionary.cambridge.org/dictionary/english/example"
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
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
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 font-semibold rounded"
            style={{
              backgroundColor: isLoading ? "#93C5FD" : "#3B82F6",
              color: "white",
              border: "none",
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
