import { describe, expect, it } from "vitest";
import {
  appStateReducer,
  createInitialState,
  getActiveGames,
  getCompletedGameCount,
  isGameCompleted,
  isTaskCompleted
} from "./state";
import { createCustomGame, createTask } from "./games";
import { GAME_CATALOG, createGameFromCatalog } from "./gameCatalog";

const NOW = new Date("2026-09-12T08:00:00.000Z");
const DATE = "2026-09-12";

describe("app state", () => {
  it("stores task completion independently for each game", () => {
    const initial = createInitialState(NOW);
    const game = initial.games[0];
    const completed = appStateReducer(initial, {
      type: "toggle-task",
      gameId: game.id,
      taskId: game.tasks[0].id,
      dateKey: DATE,
      completedAt: NOW.toISOString()
    });

    expect(isTaskCompleted(completed, game.id, game.tasks[0].id, DATE)).toBe(true);
    expect(isTaskCompleted(completed, game.id, game.tasks[1].id, DATE)).toBe(false);
    expect(isGameCompleted(completed, game, DATE)).toBe(false);

    const reverted = appStateReducer(completed, {
      type: "toggle-task",
      gameId: game.id,
      taskId: game.tasks[0].id,
      dateKey: DATE,
      completedAt: NOW.toISOString()
    });
    expect(isTaskCompleted(reverted, game.id, game.tasks[0].id, DATE)).toBe(false);
  });

  it("marks a game complete only after all tasks are checked", () => {
    const initial = createInitialState(NOW);
    const game = initial.games[0];
    let state = initial;

    for (const task of game.tasks) {
      state = appStateReducer(state, {
        type: "toggle-task",
        gameId: game.id,
        taskId: task.id,
        dateKey: DATE,
        completedAt: NOW.toISOString()
      });
    }

    expect(isGameCompleted(state, game, DATE)).toBe(true);
    expect(getCompletedGameCount(state, DATE)).toBe(1);
  });

  it("archives without losing task history and can restore", () => {
    const initial = createInitialState(NOW);
    const game = initial.games[0];
    const withRecord = appStateReducer(initial, {
      type: "toggle-task",
      gameId: game.id,
      taskId: game.tasks[0].id,
      dateKey: DATE,
      completedAt: NOW.toISOString()
    });
    const archived = appStateReducer(withRecord, {
      type: "archive-game",
      gameId: game.id,
      archivedAt: NOW.toISOString()
    });

    expect(getActiveGames(archived).map((item) => item.id)).not.toContain(game.id);
    expect(isTaskCompleted(archived, game.id, game.tasks[0].id, DATE)).toBe(true);

    const restored = appStateReducer(archived, { type: "restore-game", gameId: game.id });
    expect(restored.games[0].archivedAt).toBeNull();
  });

  it("does not add the same catalog game twice", () => {
    const initial = createInitialState(NOW);
    const entry = GAME_CATALOG[1];
    const added = appStateReducer(initial, {
      type: "add-game",
      game: createGameFromCatalog(entry, NOW)
    });
    const duplicate = appStateReducer(added, {
      type: "add-game",
      game: createGameFromCatalog(entry, NOW)
    });
    expect(duplicate.games.filter((game) => game.catalogId === entry.id)).toHaveLength(1);
  });

  it("supports a game-specific custom task list", () => {
    const initial = createInitialState(NOW);
    const game = createCustomGame("测试游戏", NOW);
    const withGame = appStateReducer(initial, { type: "add-game", game });
    const withTask = appStateReducer(withGame, {
      type: "add-task",
      gameId: game.id,
      task: createTask("测试任务", NOW)
    });
    const renamed = appStateReducer(withTask, {
      type: "rename-task",
      gameId: game.id,
      taskId: withTask.games.at(-1)!.tasks[1].id,
      name: "改名后的任务"
    });

    expect(renamed.games.at(-1)!.tasks.map((task) => task.name)).toEqual(["完成今日日常", "改名后的任务"]);
  });

  it("stores separate global and per-game background preferences", () => {
    const initial = createInitialState(NOW);
    const preference = { type: "url" as const, mediaType: "image" as const, value: "https://example.com/bg.jpg" };
    const globalState = appStateReducer(initial, { type: "set-background", target: "global", background: preference });
    const gameState = appStateReducer(globalState, {
      type: "set-background",
      target: { gameId: initial.games[0].id },
      background: { ...preference, mediaType: "video", value: "https://example.com/bg.mp4" }
    });

    expect(gameState.backgrounds.global?.value).toBe("https://example.com/bg.jpg");
    expect(gameState.backgrounds.games[initial.games[0].id].mediaType).toBe("video");
  });
});
