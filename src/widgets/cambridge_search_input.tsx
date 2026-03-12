import { renderWidget, usePlugin } from "@remnote/plugin-sdk";
import React, { useState, useRef, useEffect } from "react";
import { fetchWordDefinitions } from "../lib/scraper";
import { createMultipleWordRems } from "../lib/rem-creator";
import { log } from "../lib/logging";

function CambridgeSearchInput() {
  const plugin = usePlugin();
  const [word, setWord] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setIsLoading(true);
    setStatus(`Searching for "${word}"...`);

    try {
      const entries = await fetchWordDefinitions(word.trim());
      if (entries.length === 0) {
        setStatus(`No definitions found for "${word}".`);
        setIsLoading(false);
        return;
      }

      setStatus(`Found ${entries.length} definition(s). Importing...`);
      const count = await createMultipleWordRems(plugin, entries);
      log(plugin, `Imported ${count} definition(s) for "${word}".`, true);
      await plugin.widget.closePopup();
    } catch (error) {
      setStatus(`Error: ${error}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="text-2xl font-bold">Cambridge: Search Word</div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="search-word-input" className="font-semibold">
            Enter a word:
          </label>
          <input
            ref={inputRef}
            id="search-word-input"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit(e);
            }}
            placeholder="e.g., cranky"
            disabled={isLoading}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
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
            {isLoading ? "Searching..." : "Search & Import"}
          </button>
        </div>
      </form>
    </div>
  );
}

renderWidget(CambridgeSearchInput);
