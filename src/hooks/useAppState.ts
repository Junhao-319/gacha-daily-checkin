import { useEffect, useReducer, useState } from "react";
import { appStateReducer, createInitialState } from "../lib/state";
import {
  clearPersistedState,
  getSafeBrowserStorage,
  loadPersistedState,
  parsePersistedState,
  savePersistedState
} from "../lib/storage";
import type { AppAction } from "../lib/state";
import type { PersistedStateV3 } from "../types";

function persistNativeState(state: PersistedStateV3) {
  void fetch(`${import.meta.env.BASE_URL}api/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
    keepalive: true
  }).catch(() => undefined);
}

export function useAppState() {
  const [loaded] = useState(() => loadPersistedState());
  const [state, dispatch] = useReducer(appStateReducer, loaded.state);
  const [storageError, setStorageError] = useState<string | null>(loaded.error);
  const [persistenceReady, setPersistenceReady] = useState(loaded.hasStoredState || Boolean(loaded.error));

  useEffect(() => {
    if (persistenceReady) {
      return;
    }

    const controller = new AbortController();

    async function restoreNativeState() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/state`, {
          signal: controller.signal,
          cache: "no-store"
        });
        if (response.ok) {
          const text = await response.text();
          if (text.trim().length > 2) {
            dispatch({ type: "reset", state: parsePersistedState(text) });
          }
        }
      } catch {
        // 浏览器版本没有本地状态接口。
      } finally {
        if (!controller.signal.aborted) {
          setPersistenceReady(true);
        }
      }
    }

    void restoreNativeState();
    return () => controller.abort();
  }, [persistenceReady]);

  useEffect(() => {
    if (storageError || !persistenceReady) {
      return;
    }

    const error = savePersistedState(state, getSafeBrowserStorage());
    if (error) {
      setStorageError(error);
      return;
    }
    persistNativeState(state);
  }, [state, storageError, persistenceReady]);

  function resetData(): string | null {
    const error = clearPersistedState(getSafeBrowserStorage());
    if (error) {
      setStorageError(error);
      return error;
    }

    const nextState = createInitialState();
    dispatch({ type: "reset", state: nextState });
    setPersistenceReady(true);
    setStorageError(null);
    persistNativeState(nextState);
    return null;
  }

  return {
    state,
    dispatch: dispatch as React.Dispatch<AppAction>,
    storageError,
    resetData
  };
}