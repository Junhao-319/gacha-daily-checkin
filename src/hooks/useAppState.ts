import { useEffect, useReducer, useState } from "react";
import { appStateReducer, createInitialState } from "../lib/state";
import {
  clearPersistedState,
  getSafeBrowserStorage,
  loadPersistedState,
  savePersistedState
} from "../lib/storage";
import type { AppAction } from "../lib/state";


export function useAppState() {
  const [loaded] = useState(() => loadPersistedState());
  const [state, dispatch] = useReducer(appStateReducer, loaded.state);
  const [storageError, setStorageError] = useState<string | null>(loaded.error);

  useEffect(() => {
    if (storageError) {
      return;
    }

    const error = savePersistedState(state, getSafeBrowserStorage());
    if (error) {
      setStorageError(error);
    }
  }, [state, storageError]);

  function resetData(): string | null {
    const error = clearPersistedState(getSafeBrowserStorage());
    if (error) {
      setStorageError(error);
      return error;
    }

    dispatch({ type: "reset", state: createInitialState() });
    setStorageError(null);
    return null;
  }

  return {
    state,
    dispatch: dispatch as React.Dispatch<AppAction>,
    storageError,
    resetData
  };
}