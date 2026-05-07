import {
  renderWidget,
  usePlugin,
  useTrackerPlugin,
  SelectionType,
} from "@remnote/plugin-sdk";
import React from "react";
import { PreviewCambridgeDefinitions } from "../components/PreviewCambridgeDefinitions";
import { DictionaryEntry } from "../lib/models";
import { useDebounce } from "../hooks/useDebounce";
import { useFetch } from "../hooks/useFetch";
import { API_BASE_URL, mapApiResponseToEntries } from "../lib/scraper";
import { createWordRem } from "../lib/rem-creator";
import { log } from "../lib/logging";

function cleanSelectedText(s?: string): string | undefined {
  return s
    ?.trim()
    ?.split(/(\s+)/)[0]
    ?.replaceAll(/[^a-zA-Z'-]/g, "");
}

function SelectedTextCambridge() {
  const plugin = usePlugin();

  const searchTerm = useDebounce(
    useTrackerPlugin(async (reactivePlugin) => {
      const sel = await reactivePlugin.editor.getSelection();
      if (sel?.type == SelectionType.Text) {
        return cleanSelectedText(
          await reactivePlugin.richText.toString(sel.richText)
        );
      } else {
        return undefined;
      }
    }),
    300
  );

  // Fetch directly from the CORS-safe JSON API
  const { response, isLoading, isError } = useFetch<any[] | null>(
    searchTerm ? API_BASE_URL + encodeURIComponent(searchTerm.toLowerCase()) : null,
    null
  );

  const entries: DictionaryEntry[] =
    response && Array.isArray(response) ? mapApiResponseToEntries(response) : [];

  const handleSaveEntry = async (entry: DictionaryEntry) => {
    const success = await createWordRem(plugin, entry);
    if (success) {
      log(plugin, `Added "${entry.word}" to your knowledge base!`, true);
    }
  };

  return (
    <div className="min-h-[200px] max-h-[500px] overflow-y-scroll m-4">
      {isLoading ? (
        <p className="rn-clr-content-secondary">Looking up…</p>
      ) : isError ? (
        <p className="rn-clr-content-secondary">
          An error occurred fetching from the dictionary.
        </p>
      ) : searchTerm ? (
        entries.length > 0 ? (
          <PreviewCambridgeDefinitions
            entries={entries}
            onSaveEntry={handleSaveEntry}
          />
        ) : (
          <p className="rn-clr-content-secondary">
            No definition found for &quot;{searchTerm}&quot;.
          </p>
        )
      ) : (
        <p className="rn-clr-content-secondary">
          Select a word to look it up.
        </p>
      )}
    </div>
  );
}

renderWidget(SelectedTextCambridge);
