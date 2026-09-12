import { createInitialState } from "./state";
import { createTasksForCatalog, findCatalogEntryByName, getCatalogEntry } from "./gameCatalog";
import type { Game, GameTask, PersistedStateV2, StorageLoadResult, ThemeMode } from "../types";

export const STORAGE_KEY = "gacha-daily-checkin:v2";
export const LEGACY_STORAGE_KEY = "gacha-daily-checkin:v1";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function parseTask(value: unknown, index: number, now: Date): GameTask {
  if (!isRecord(value)) {
    throw new Error(`任务数据第 ${index + 1} 项格式不正确`);
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error(`任务数据第 ${index + 1} 项缺少有效 ID`);
  }

  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    throw new Error(`任务数据第 ${index + 1} 项缺少名称`);
  }

  return {
    id: value.id,
    name: value.name.trim(),
    createdAt: optionalString(value.createdAt, now.toISOString())
  };
}

function parseV2Game(value: unknown, index: number, now: Date): Game {
  if (!isRecord(value)) {
    throw new Error(`游戏数据第 ${index + 1} 项格式不正确`);
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error(`游戏数据第 ${index + 1} 项缺少有效 ID`);
  }

  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    throw new Error(`游戏数据第 ${index + 1} 项缺少游戏名称`);
  }

  const catalogId = typeof value.catalogId === "string" ? value.catalogId : null;
  const catalogEntry = getCatalogEntry(catalogId) ?? findCatalogEntryByName(value.name);
  const tasksValue = value.tasks;
  const tasks = Array.isArray(tasksValue)
    ? tasksValue.map((task, taskIndex) => parseTask(task, taskIndex, now))
    : catalogEntry
      ? createTasksForCatalog(catalogEntry, now)
      : [
          {
            id: "task-1",
            name: "完成今日日常",
            createdAt: now.toISOString()
          }
        ];

  return {
    id: value.id,
    catalogId: catalogEntry?.id ?? catalogId,
    name: catalogEntry?.name ?? value.name.trim(),
    createdAt: optionalString(value.createdAt, now.toISOString()),
    archivedAt: typeof value.archivedAt === "string" ? value.archivedAt : null,
    tasks
  };
}

function parseV2CheckIns(value: unknown): PersistedStateV2["checkIns"] {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    throw new Error("打卡记录格式不正确");
  }

  const checkIns: PersistedStateV2["checkIns"] = {};

  for (const [gameId, gameRecords] of Object.entries(value)) {
    if (!isRecord(gameRecords)) {
      throw new Error(`游戏 ${gameId} 的打卡记录格式不正确`);
    }

    checkIns[gameId] = {};
    for (const [dateKey, taskRecords] of Object.entries(gameRecords)) {
      if (!DATE_KEY_PATTERN.test(dateKey) || !isRecord(taskRecords)) {
        throw new Error(`游戏 ${gameId} 的打卡记录包含无效日期或任务`);
      }

      checkIns[gameId][dateKey] = {};
      for (const [taskId, completedAt] of Object.entries(taskRecords)) {
        if (typeof completedAt !== "string" || Number.isNaN(new Date(completedAt).getTime())) {
          throw new Error(`任务 ${taskId} 的完成时间无效`);
        }
        checkIns[gameId][dateKey][taskId] = completedAt;
      }
    }
  }

  return checkIns;
}

function migrateV1(parsed: Record<string, unknown>, now: Date): PersistedStateV2 {
  const gamesValue = parsed.games ?? [];
  if (!Array.isArray(gamesValue)) {
    throw new Error("旧版游戏列表格式不正确");
  }

  const games: Game[] = gamesValue.map((rawGame, index) => {
    if (!isRecord(rawGame)) {
      throw new Error(`旧版游戏数据第 ${index + 1} 项格式不正确`);
    }

    const id = rawGame.id;
    const name = rawGame.name;
    if (typeof id !== "string" || typeof name !== "string" || name.trim().length === 0) {
      throw new Error(`旧版游戏数据第 ${index + 1} 项缺少有效信息`);
    }

    const catalogEntry = findCatalogEntryByName(name);
    return {
      id,
      catalogId: catalogEntry?.id ?? null,
      name: catalogEntry?.name ?? name.trim(),
      createdAt: optionalString(rawGame.createdAt, now.toISOString()),
      archivedAt: typeof rawGame.archivedAt === "string" ? rawGame.archivedAt : null,
      tasks: catalogEntry
        ? createTasksForCatalog(catalogEntry, new Date(optionalString(rawGame.createdAt, now.toISOString())))
        : [
            {
              id: "task-1",
              name: "完成今日日常",
              createdAt: optionalString(rawGame.createdAt, now.toISOString())
            }
          ]
    };
  });

  const checkIns: PersistedStateV2["checkIns"] = {};
  if (parsed.checkIns !== undefined && !isRecord(parsed.checkIns)) {
    throw new Error("旧版打卡记录格式不正确");
  }

  for (const game of games) {
    const oldGameRecords = (parsed.checkIns as Record<string, unknown> | undefined)?.[game.id];
    if (!isRecord(oldGameRecords)) {
      continue;
    }

    checkIns[game.id] = {};
    for (const [dateKey, completedAt] of Object.entries(oldGameRecords)) {
      if (!DATE_KEY_PATTERN.test(dateKey) || typeof completedAt !== "string") {
        throw new Error(`旧版游戏 ${game.id} 的打卡记录格式不正确`);
      }

      checkIns[game.id][dateKey] = Object.fromEntries(
        game.tasks.map((task) => [task.id, completedAt])
      );
    }
  }

  const theme: ThemeMode =
    parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system"
      ? parsed.theme
      : "system";

  return {
    version: 2,
    games,
    checkIns,
    theme
  };
}

export function parsePersistedState(raw: string, now = new Date()): PersistedStateV2 {
  const parsed: unknown = JSON.parse(raw);

  if (!isRecord(parsed)) {
    throw new Error("本地数据根结构不正确");
  }

  if (parsed.version === 1) {
    return migrateV1(parsed, now);
  }

  if (parsed.version !== 2) {
    throw new Error("本地数据版本不受支持");
  }

  const gamesValue = parsed.games ?? [];
  if (!Array.isArray(gamesValue)) {
    throw new Error("游戏列表格式不正确");
  }

  const games = gamesValue.map((game, index) => parseV2Game(game, index, now));
  const gameIds = new Set(games.map((game) => game.id));
  if (gameIds.size !== games.length) {
    throw new Error("游戏列表包含重复 ID");
  }

  const theme: ThemeMode =
    parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system"
      ? parsed.theme
      : "system";

  return {
    version: 2,
    games,
    checkIns: parseV2CheckIns(parsed.checkIns),
    theme
  };
}

export function getSafeBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadPersistedState(
  storage: StorageLike | null = getSafeBrowserStorage(),
  now = new Date()
): StorageLoadResult {
  if (!storage) {
    return {
      state: createInitialState(now),
      error: "当前浏览器无法访问本地存储，打卡记录将无法保存。"
    };
  }

  try {
    const raw = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return { state: createInitialState(now), error: null };
    }

    return { state: parsePersistedState(raw, now), error: null };
  } catch (error) {
    return {
      state: createInitialState(now),
      error: error instanceof Error ? error.message : "本地数据读取失败"
    };
  }
}

export function savePersistedState(state: PersistedStateV2, storage: StorageLike | null): string | null {
  if (!storage) {
    return "当前浏览器无法访问本地存储，打卡记录将无法保存。";
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return null;
  } catch {
    return "写入本地存储失败，请检查浏览器隐私设置或剩余空间。";
  }
}

export function clearPersistedState(storage: StorageLike | null): string | null {
  if (!storage) {
    return "当前浏览器无法访问本地存储。";
  }

  try {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);
    return null;
  } catch {
    return "清除本地数据失败。";
  }
}