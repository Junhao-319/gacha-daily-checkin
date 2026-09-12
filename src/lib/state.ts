import { createInitialGames } from "./games";
import { toDateKey } from "./date";
import type { BackgroundPreference, Game, PersistedStateV3, ThemeMode } from "../types";

export type AppAction =
  | { type: "toggle-task"; gameId: string; taskId: string; dateKey: string; completedAt: string }
  | { type: "add-game"; game: Game }
  | { type: "rename-game"; gameId: string; name: string }
  | { type: "archive-game"; gameId: string; archivedAt: string }
  | { type: "restore-game"; gameId: string }
  | { type: "add-task"; gameId: string; task: Game["tasks"][number] }
  | { type: "rename-task"; gameId: string; taskId: string; name: string }
  | { type: "remove-task"; gameId: string; taskId: string }
  | { type: "set-theme"; theme: ThemeMode }
  | { type: "set-background"; target: "global" | { gameId: string }; background: BackgroundPreference | null }
  | { type: "reset"; state: PersistedStateV3 };

export function createInitialState(now = new Date()): PersistedStateV3 {
  return {
    version: 3,
    games: createInitialGames(now),
    checkIns: {},
    theme: "system",
    backgrounds: {
      global: null,
      homeCustomEnabled: false,
      games: {}
    }
  };
}

function replaceGame(games: Game[], gameId: string, update: (game: Game) => Game): Game[] {
  return games.map((game) => (game.id === gameId ? update(game) : game));
}

export function appStateReducer(state: PersistedStateV3, action: AppAction): PersistedStateV3 {
  switch (action.type) {
    case "toggle-task": {
      const currentRecords = state.checkIns[action.gameId] ?? {};
      const currentTasks = { ...(currentRecords[action.dateKey] ?? {}) };

      if (currentTasks[action.taskId]) {
        delete currentTasks[action.taskId];
      } else {
        currentTasks[action.taskId] = action.completedAt;
      }

      const nextRecords = { ...currentRecords };
      if (Object.keys(currentTasks).length === 0) {
        delete nextRecords[action.dateKey];
      } else {
        nextRecords[action.dateKey] = currentTasks;
      }

      const nextCheckIns = { ...state.checkIns };
      if (Object.keys(nextRecords).length === 0) {
        delete nextCheckIns[action.gameId];
      } else {
        nextCheckIns[action.gameId] = nextRecords;
      }

      return { ...state, checkIns: nextCheckIns };
    }

    case "add-game": {
      if (
        action.game.catalogId &&
        state.games.some((game) => game.catalogId === action.game.catalogId)
      ) {
        return state;
      }
      return { ...state, games: [...state.games, action.game] };
    }

    case "rename-game":
      return {
        ...state,
        games: replaceGame(state.games, action.gameId, (game) => ({ ...game, name: action.name }))
      };

    case "archive-game":
      return {
        ...state,
        games: replaceGame(state.games, action.gameId, (game) => ({
          ...game,
          archivedAt: action.archivedAt
        }))
      };

    case "restore-game":
      return {
        ...state,
        games: replaceGame(state.games, action.gameId, (game) => ({ ...game, archivedAt: null }))
      };

    case "add-task":
      return {
        ...state,
        games: replaceGame(state.games, action.gameId, (game) => ({
          ...game,
          tasks: [...game.tasks, action.task]
        }))
      };

    case "rename-task":
      return {
        ...state,
        games: replaceGame(state.games, action.gameId, (game) => ({
          ...game,
          tasks: game.tasks.map((task) =>
            task.id === action.taskId ? { ...task, name: action.name } : task
          )
        }))
      };

    case "remove-task": {
      const nextGames = replaceGame(state.games, action.gameId, (game) => ({
        ...game,
        tasks: game.tasks.filter((task) => task.id !== action.taskId)
      }));

      const nextCheckIns = { ...state.checkIns };
      const gameRecords = nextCheckIns[action.gameId];
      if (gameRecords) {
        const cleanedRecords: typeof gameRecords = {};
        for (const [dateKey, tasks] of Object.entries(gameRecords)) {
          const nextTasks = { ...tasks };
          delete nextTasks[action.taskId];
          if (Object.keys(nextTasks).length > 0) {
            cleanedRecords[dateKey] = nextTasks;
          }
        }

        if (Object.keys(cleanedRecords).length > 0) {
          nextCheckIns[action.gameId] = cleanedRecords;
        } else {
          delete nextCheckIns[action.gameId];
        }
      }

      return { ...state, games: nextGames, checkIns: nextCheckIns };
    }

    case "set-theme":
      return { ...state, theme: action.theme };

    case "set-background": {
      if (action.target === "global") {
        return {
          ...state,
          backgrounds: { ...state.backgrounds, global: action.background, homeCustomEnabled: Boolean(action.background) }
        };
      }

      const nextGames = { ...state.backgrounds.games };
      if (action.background) {
        nextGames[action.target.gameId] = action.background;
      } else {
        delete nextGames[action.target.gameId];
      }
      return { ...state, backgrounds: { ...state.backgrounds, games: nextGames } };
    }

    case "reset":
      return action.state;
  }
}

export function getActiveGames(state: PersistedStateV3): Game[] {
  return state.games.filter((game) => game.archivedAt === null);
}

export function getArchivedGames(state: PersistedStateV3): Game[] {
  return state.games.filter((game) => game.archivedAt !== null);
}

export function isTaskCompleted(
  state: PersistedStateV3,
  gameId: string,
  taskId: string,
  dateKey: string
): boolean {
  return Boolean(state.checkIns[gameId]?.[dateKey]?.[taskId]);
}

export function getTaskCompletionTime(
  state: PersistedStateV3,
  gameId: string,
  taskId: string,
  dateKey: string
): string | undefined {
  return state.checkIns[gameId]?.[dateKey]?.[taskId];
}

export function getApplicableTasks(game: Game, dateKey: string): Game["tasks"] {
  return game.tasks.filter((task) => {
    const createdAt = new Date(task.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return true;
    }
    return toDateKey(createdAt) <= dateKey;
  });
}

export function getTaskProgress(
  state: PersistedStateV3,
  game: Game,
  dateKey: string
): { completed: number; total: number; ratio: number } {
  const applicableTasks = getApplicableTasks(game, dateKey);
  const total = applicableTasks.length;
  const completed = applicableTasks.filter((task) =>
    isTaskCompleted(state, game.id, task.id, dateKey)
  ).length;
  return {
    completed,
    total,
    ratio: total === 0 ? 0 : completed / total
  };
}

export function isGameCompleted(state: PersistedStateV3, game: Game, dateKey: string): boolean {
  const progress = getTaskProgress(state, game, dateKey);
  return progress.total > 0 && progress.completed === progress.total;
}

export function getCompletedGameCount(state: PersistedStateV3, dateKey: string): number {
  return state.games.reduce(
    (count, game) => count + (isGameCompleted(state, game, dateKey) ? 1 : 0),
    0
  );
}

export function getCompletedTaskCount(state: PersistedStateV3, dateKey: string): number {
  return state.games.reduce(
    (count, game) => count + getTaskProgress(state, game, dateKey).completed,
    0
  );
}

export function getTotalTaskCount(state: PersistedStateV3): number {
  return state.games.reduce((count, game) => count + game.tasks.length, 0);
}