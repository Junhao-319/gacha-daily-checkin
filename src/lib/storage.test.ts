import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import {
  LEGACY_STORAGE_KEY,
  loadPersistedState,
  parsePersistedState,
  savePersistedState,
  STORAGE_KEY,
  type StorageLike
} from "./storage";

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

describe("storage", () => {
  it("starts with the three full-name default games and task templates", () => {
    const result = loadPersistedState(createMemoryStorage());
    expect(result.error).toBeNull();
    expect(result.state.games.map((game) => game.name)).toEqual([
      "崩坏：星穹铁道",
      "鸣潮",
      "明日方舟：终末地"
    ]);
    expect(result.state.games.every((game) => game.tasks.length >= 3)).toBe(true);
  });

  it("round-trips task-level check-ins", () => {
    const storage = createMemoryStorage();
    const state = createInitialState(new Date("2026-09-12T08:00:00.000Z"));
    const game = state.games[0];
    state.checkIns[game.id] = {
      "2026-09-12": {
        [game.tasks[0].id]: "2026-09-12T08:00:00.000Z"
      }
    };

    expect(savePersistedState(state, storage)).toBeNull();
    expect(loadPersistedState(storage).state).toEqual(state);
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("migrates v1 game-level completion into every game task", () => {
    const legacy = JSON.stringify({
      version: 1,
      games: [
        {
          id: "default-1",
          name: "星穹铁道",
          createdAt: "2026-09-01T00:00:00.000Z",
          archivedAt: null
        }
      ],
      checkIns: {
        "default-1": {
          "2026-09-12": "2026-09-12T08:00:00.000Z"
        }
      },
      theme: "dark"
    });
    const storage = createMemoryStorage({ [LEGACY_STORAGE_KEY]: legacy });
    const state = loadPersistedState(storage).state;

    expect(state.version).toBe(2);
    expect(state.games[0].name).toBe("崩坏：星穹铁道");
    expect(Object.values(state.checkIns["default-1"]["2026-09-12"])).toHaveLength(
      state.games[0].tasks.length
    );
    expect(state.theme).toBe("dark");
  });

  it("rejects malformed data instead of silently replacing it", () => {
    const result = loadPersistedState(createMemoryStorage({ [STORAGE_KEY]: "{not json" }));
    expect(result.error).not.toBeNull();
    expect(result.state.games).toHaveLength(3);
  });

  it("fills optional v2 fields and falls back to system theme", () => {
    const parsed = parsePersistedState(
      JSON.stringify({
        version: 2,
        games: [{ id: "one", name: "原神", catalogId: "genshin-impact" }],
        checkIns: {}
      }),
      new Date("2026-09-12T08:00:00.000Z")
    );

    expect(parsed.games[0]).toMatchObject({ id: "one", name: "原神", archivedAt: null });
    expect(parsed.games[0].tasks.length).toBeGreaterThan(0);
    expect(parsed.theme).toBe("system");
  });
});