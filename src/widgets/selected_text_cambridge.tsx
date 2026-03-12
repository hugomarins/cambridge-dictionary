import {
  renderWidget,
  usePlugin,
  LoadingSpinnerPlugin,
  useTrackerPlugin,
  SelectionType,
} from "@remnote/plugin-sdk";
import { PreviewCambridgeDefinitions } from "../components/PreviewCambridgeDefinitions";
import { CambridgeWordEntry } from "../lib/models";
import { useDebounce } from "../hooks/useDebounce";
import { fetchWordDefinitions } from "../lib/scraper";
import { createWordRem, createMultipleWordRems } from "../lib/rem-creator";
import { log } from "../lib/logging";
import React, { useState, useEffect } from "react";

function cleanSelectedText(s?: string): string | undefined {
  return s
    ?.trim()
    ?.split(/(\s+)/)[0]
    ?.replaceAll(/[^a-zA-Z'-]/g, "");
}

function SelectedTextCambridge() {
  const plugin = usePlugin();
  const [entries, setEntries] = useState<CambridgeWordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const searchTerm = useDebounce(
    useTrackerPlugin(async (reactivePlugin) => {
      const sel = await reactivePlugin.editor.getSelection();
      if (sel?.type == SelectionType.Text) {
        return cleanSelectedText(await reactivePlugin.richText.toString(sel.richText));
      } else {
        return undefined;
      }
    }),
    500
  );

  // Fetch definitions when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setEntries([]);
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const results = await fetchWordDefinitions(searchTerm);
        if (!cancelled) {
          setEntries(results);
        }
      } catch (e) {
        if (!cancelled) {
          setIsError(true);
          console.error("Cambridge fetch error:", e);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  const handleSaveEntry = async (entry: CambridgeWordEntry) => {
    const success = await createWordRem(plugin, entry);
    if (success) {
      log(plugin, `Added "${entry.wordTitle}" to your knowledge base!`, true);
    }
  };

  const handleSaveAll = async () => {
    const count = await createMultipleWordRems(plugin, entries);
    log(plugin, `Added ${count} definitions to your knowledge base!`, true);
  };

  return (
    <div className="min-h-[200px] max-h-[500px] overflow-y-scroll m-4 font-inter">
      {isLoading ? (
        <LoadingSpinnerPlugin />
      ) : isError ? (
        <p className="rn-clr-content-secondary">
          An error occurred fetching from Cambridge Dictionary.
        </p>
      ) : searchTerm ? (
        entries.length > 0 ? (
          <PreviewCambridgeDefinitions
            entries={entries}
            onSaveEntry={handleSaveEntry}
            onSaveAll={handleSaveAll}
          />
        ) : (
          <p className="rn-clr-content-secondary">
            No Cambridge Dictionary definition found for &quot;{searchTerm}&quot;.
          </p>
        )
      ) : (
        <p className="rn-clr-content-secondary">
          Select a word to look it up on Cambridge Dictionary.
        </p>
      )}
    </div>
  );
}

renderWidget(SelectedTextCambridge);
