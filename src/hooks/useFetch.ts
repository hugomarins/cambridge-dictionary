import React from "react";

enum FetchDataActionType {
  INIT = "INIT",
  ERROR = "ERROR",
  DONE = "DONE",
}

type FetchDataAction<T> =
  | { type: FetchDataActionType.INIT }
  | { type: FetchDataActionType.ERROR; message: string }
  | { type: FetchDataActionType.DONE; payload: T };

type FetchDataState<T> = { response: T; isLoading: boolean; isError: boolean };

function apiReducer<T>(
  prevState: FetchDataState<T>,
  action: FetchDataAction<T>
): FetchDataState<T> {
  switch (action.type) {
    case FetchDataActionType.INIT:
      return { ...prevState, isLoading: true, isError: false };
    case FetchDataActionType.ERROR:
      console.log(action.message);
      return { ...prevState, isError: true, isLoading: false };
    case FetchDataActionType.DONE:
      return { ...prevState, response: action.payload, isLoading: false };
    default:
      throw new Error("apiReducer: Unknown state...");
  }
}

/**
 * A custom hook for fetching JSON data from a URL.
 * Returns { response, isLoading, isError }.
 * If url is null, does nothing.
 */
export function useFetch<T>(
  url: string | null,
  initialData: T
): FetchDataState<T> {
  const initialState = {
    response: initialData,
    isLoading: false,
    isError: false,
  };
  const [{ response, isLoading, isError }, dispatch] = React.useReducer(
    apiReducer as (s: FetchDataState<T>, a: FetchDataAction<T>) => FetchDataState<T>,
    initialState
  );

  React.useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const load = async () => {
      dispatch({ type: FetchDataActionType.INIT });
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          // API returned an error status (e.g. 404 for unknown words)
          dispatch({ type: FetchDataActionType.DONE, payload: initialData });
          return;
        }
        const json = await res.json();
        dispatch({ type: FetchDataActionType.DONE, payload: json });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        const msg = e instanceof Error ? e.message : `Error fetching ${url}`;
        dispatch({ type: FetchDataActionType.ERROR, message: msg });
      }
    };
    load();
    return () => controller.abort();
  }, [url]);

  return { response, isLoading, isError };
}
