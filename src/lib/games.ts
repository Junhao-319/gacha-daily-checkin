import {
  createGameFromCatalog,
  createTasksForCatalog,
  DEFAULT_CATALOG_IDS,
  findCatalogEntryByName,
  getCatalogEntry,
  getCatalogEntryForGame
} from "./gameCatalog";
import type { Game, GameTask } from "../types";

const COLOR_PALETTE = [
  "#0ea5e9",
  "#6366f1",
  "#14b8a6",
  "#ec4899",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#f43f5e"
];

export const GAME_NAME_MAX_LENGTH = 30;

export function createInitialGames(now = new Date()): Game[] {
  return DEFAULT_CATALOG_IDS.map((catalogId, index) => {
    const entry = getCatalogEntry(catalogId);
    if (!entry) {
      throw new Error(`缺少预置游戏：${catalogId}`);
    }
    return createGameFromCatalog(entry, now, `default-${index + 1}`);
  });
}

export function normalizeGameName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function getGameNameError(name: string, games: Game[], currentId?: string): string | null {
  const normalizedName = normalizeGameName(name);
  const characters = Array.from(normalizedName);

  if (characters.length === 0) {
    return "请输入游戏名称";
  }

  if (characters.length > GAME_NAME_MAX_LENGTH) {
    return `名称不能超过 ${GAME_NAME_MAX_LENGTH} 个字符`;
  }

  const comparableName = normalizedName.normalize("NFKC").replace(/\s+/g, "").toLocaleLowerCase("zh-CN");
  const duplicate = games.some((game) => {
    if (game.id === currentId) {
      return false;
    }

    return game.name.normalize("NFKC").trim().replace(/\s+/g, "").toLocaleLowerCase("zh-CN") === comparableName;
  });

  return duplicate ? "已经存在同名游戏" : null;
}

export function createCustomGame(name: string, now = new Date()): Game {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `game-${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    catalogId: null,
    name: normalizeGameName(name),
    createdAt: now.toISOString(),
    archivedAt: null,
    tasks: [
      {
        id: "task-1",
        name: "完成今日日常",
        createdAt: now.toISOString()
      }
    ]
  };
}

export function createTask(name: string, now = new Date()): GameTask {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `task-${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    createdAt: now.toISOString()
  };
}

export function getGameColor(gameId: string): string {
  let hash = 2166136261;
  for (const character of gameId) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

export function getGameInitial(name: string): string {
  return Array.from(name.trim())[0] ?? "游";
}

export function getGameArtworkPath(game: Game): string | null {
  return getCatalogEntryForGame(game)?.artwork ?? null;
}

export function getGameAccent(game: Game): string {
  return getCatalogEntryForGame(game)?.accent ?? getGameColor(game.id);
}

export function upgradeLegacyGame(game: Game): { game: Game; migratedTasks: GameTask[] } {
  const catalogEntry = getCatalogEntry(game.catalogId) ?? findCatalogEntryByName(game.name);
  if (!catalogEntry) {
    return { game, migratedTasks: game.tasks };
  }

  const tasks = game.tasks.length > 0 ? game.tasks : createTasksForCatalog(catalogEntry, new Date(game.createdAt));
  return {
    game: {
      ...game,
      catalogId: catalogEntry.id,
      name: catalogEntry.name,
      tasks
    },
    migratedTasks: tasks
  };
}