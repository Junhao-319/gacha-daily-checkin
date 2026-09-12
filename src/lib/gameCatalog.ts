import type { Game, GameTask } from "../types";

export interface GameTaskTemplate {
  name: string;
}

export interface GameCatalogEntry {
  id: string;
  name: string;
  aliases: string[];
  publisher: string;
  genre: string;
  accent: string;
  artwork: string | null;
  tasks: string[];
}

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: "honkai-impact-3rd",
    name: "崩坏3",
    aliases: ["崩坏三", "Honkai Impact 3rd"],
    publisher: "米哈游",
    genre: "动作",
    accent: "#4f7cff",
    artwork: "game-art/honkai-impact-3rd.png",
    tasks: ["完成每日任务", "消耗体力", "领取家园奖励", "完成开放世界委托"]
  },
  {
    id: "genshin-impact",
    name: "原神",
    aliases: ["Genshin Impact", "原神：提瓦特"],
    publisher: "米哈游",
    genre: "开放世界",
    accent: "#24b6a6",
    artwork: "game-art/genshin-impact.webp",
    tasks: ["完成每日委托", "消耗原粹树脂", "领取洞天宝钱", "完成纪行任务"]
  },
  {
    id: "honkai-star-rail",
    name: "崩坏：星穹铁道",
    aliases: ["星穹铁道", "崩坏星穹铁道", "Honkai Star Rail"],
    publisher: "米哈游",
    genre: "回合制",
    accent: "#7a7cf4",
    artwork: "game-art/honkai-star-rail-v3.png",
    tasks: ["完成每日实训", "消耗开拓力", "领取派遣奖励", "收取邮件与支援奖励"]
  },
  {
    id: "zenless-zone-zero",
    name: "绝区零",
    aliases: ["Zenless Zone Zero", "ZZZ"],
    publisher: "米哈游",
    genre: "动作",
    accent: "#f4bd19",
    artwork: "game-art/zenless-zone-zero.jpg",
    tasks: ["完成每日委托", "消耗电量", "领取录像店营业奖励", "完成刮刮卡"]
  },
  {
    id: "tears-of-themis",
    name: "未定事件簿",
    aliases: ["Tears of Themis"],
    publisher: "米哈游",
    genre: "恋爱推理",
    accent: "#b8895a",
    artwork: "game-art/tears-of-themis.jpg",
    tasks: ["完成每日任务", "消耗体力", "领取基地奖励", "与好友互动"]
  },
  {
    id: "wuthering-waves",
    name: "鸣潮",
    aliases: ["Wuthering Waves", "鸣潮开放世界"],
    publisher: "库洛游戏",
    genre: "开放世界",
    accent: "#2ca9a3",
    artwork: "game-art/wuthering-waves.jpg",
    tasks: ["完成每日活跃", "消耗结晶波片", "领取邮件与月卡", "完成无音区或凝素领域"]
  },
  {
    id: "punishing-gray-raven",
    name: "战双帕弥什",
    aliases: ["Punishing Gray Raven", "战双"],
    publisher: "库洛游戏",
    genre: "动作",
    accent: "#2d8cd8",
    artwork: "game-art/punishing-gray-raven.jpg",
    tasks: ["完成每日任务", "消耗血清", "完成宿舍互动", "领取公会奖励"]
  },
  {
    id: "arknights",
    name: "明日方舟",
    aliases: ["Arknights", "方舟"],
    publisher: "鹰角网络",
    genre: "塔防",
    accent: "#d14d2f",
    artwork: "game-art/arknights.jpg",
    tasks: ["完成每日任务", "清理理智", "完成基建换班", "使用信用商店"]
  },
  {
    id: "arknights-endfield",
    name: "明日方舟：终末地",
    aliases: ["终末地", "Arknights Endfield", "Arknights: Endfield"],
    publisher: "鹰角网络",
    genre: "3D 冒险",
    accent: "#d4ae46",
    artwork: "game-art/arknights-endfield-v2.jpg",
    tasks: ["完成日常委托", "消耗理智", "收取基建产出", "领取邮件与活动奖励"]
  },
  {
    id: "blue-archive",
    name: "蔚蓝档案",
    aliases: ["Blue Archive", "碧蓝档案"],
    publisher: "悠星网络",
    genre: "角色养成",
    accent: "#36a9df",
    artwork: "game-art/blue-archive.jpg",
    tasks: ["完成每日任务", "消耗 AP", "完成战术对抗赛", "领取咖啡厅体力"]
  },
  {
    id: "azur-lane",
    name: "碧蓝航线",
    aliases: ["Azur Lane", "碧蓝"],
    publisher: "蛮啾网络",
    genre: "弹幕射击",
    accent: "#3a72c7",
    artwork: "game-art/azur-lane.png",
    tasks: ["完成每日任务", "完成困难关卡", "完成演习", "领取委托奖励"]
  },
  {
    id: "girls-frontline-2",
    name: "少女前线2：追放",
    aliases: ["少女前线2", "GIRLS' FRONTLINE 2: EXILIUM", "少前2"],
    publisher: "散爆网络",
    genre: "策略战棋",
    accent: "#e37b32",
    artwork: "game-art/girls-frontline-2.jpg",
    tasks: ["完成每日任务", "消耗体力", "完成调度室任务", "领取邮件奖励"]
  },
  {
    id: "reverse-1999",
    name: "重返未来：1999",
    aliases: ["重返未来1999", "Reverse: 1999"],
    publisher: "深蓝互动",
    genre: "策略卡牌",
    accent: "#d09245",
    artwork: "game-art/reverse-1999.jpg",
    tasks: ["完成每日任务", "消耗活性", "收取荒原产物", "完成迷思海"]
  },
  {
    id: "snowbreak",
    name: "尘白禁区",
    aliases: ["Snowbreak", "Snowbreak: Containment Zone"],
    publisher: "西山居",
    genre: "射击",
    accent: "#8794a8",
    artwork: "game-art/snowbreak.jpg",
    tasks: ["完成每日任务", "消耗体力", "完成基地任务", "领取精神拟境奖励"]
  },
  {
    id: "tower-of-fantasy",
    name: "幻塔",
    aliases: ["Tower of Fantasy", "ToF"],
    publisher: "完美世界",
    genre: "开放世界",
    accent: "#23a8c7",
    artwork: "game-art/tower-of-fantasy.jpg",
    tasks: ["完成每日活跃", "消耗活力", "完成悬赏任务", "领取公会奖励"]
  },
  {
    id: "aether-gazer",
    name: "深空之眼",
    aliases: ["Aether Gazer"],
    publisher: "勇仕网络",
    genre: "动作",
    accent: "#8d63cd",
    artwork: "game-art/aether-gazer.jpg",
    tasks: ["完成每日任务", "消耗体力", "完成多维变量", "领取商店免费奖励"]
  },
  {
    id: "infinite-nikki",
    name: "无限暖暖",
    aliases: ["Infinity Nikki"],
    publisher: "叠纸游戏",
    genre: "开放世界换装",
    accent: "#dc7fa6",
    artwork: "game-art/infinite-nikki.jpg",
    tasks: ["完成每日任务", "消耗体力", "完成祝福闪光", "领取美鸭梨奖励"]
  },
  {
    id: "love-and-deepspace",
    name: "恋与深空",
    aliases: ["Love and Deepspace"],
    publisher: "叠纸游戏",
    genre: "恋爱互动",
    accent: "#c65f91",
    artwork: "game-art/love-and-deepspace.png",
    tasks: ["完成每日任务", "消耗体力", "完成互动", "领取签到奖励"]
  },
  {
    id: "light-and-night",
    name: "光与夜之恋",
    aliases: ["Light and Night"],
    publisher: "腾讯游戏",
    genre: "恋爱互动",
    accent: "#8d5fb5",
    artwork: null,
    tasks: ["完成每日任务", "消耗灵感", "完成展会", "领取签到奖励"]
  },
  {
    id: "onmyoji",
    name: "阴阳师",
    aliases: ["Onmyoji"],
    publisher: "网易游戏",
    genre: "回合制",
    accent: "#c64d42",
    artwork: "game-art/onmyoji.jpg",
    tasks: ["完成每日任务", "消耗体力", "完成结界突破", "领取悬赏封印"]
  },
  {
    id: "fate-grand-order",
    name: "命运-冠位指定",
    aliases: ["Fate/Grand Order", "FGO"],
    publisher: "bilibili",
    genre: "回合制",
    accent: "#bf9754",
    artwork: "game-art/fate-grand-order.jpg",
    tasks: ["完成每日任务", "消耗 AP", "完成种火或 QP 本", "领取登录奖励"]
  },
  {
    id: "princess-connect",
    name: "公主连结Re:Dive",
    aliases: ["公主连结", "Princess Connect Re:Dive", "PCR"],
    publisher: "bilibili",
    genre: "角色养成",
    accent: "#dc70a8",
    artwork: "game-art/princess-connect.jpg",
    tasks: ["完成每日任务", "消耗体力", "完成地下城", "完成竞技场"]
  },
  {
    id: "path-to-nowhere",
    name: "无期迷途",
    aliases: ["Path to Nowhere"],
    publisher: "自意网络",
    genre: "塔防",
    accent: "#7464a8",
    artwork: "game-art/path-to-nowhere.jpg",
    tasks: ["完成每日任务", "消耗体力", "完成监管事件", "领取破碎防线奖励"]
  },
  {
    id: "nikke",
    name: "胜利女神：妮姬",
    aliases: ["NIKKE", "Goddess of Victory: Nikke"],
    publisher: "腾讯游戏",
    genre: "射击",
    accent: "#e75c78",
    artwork: "game-art/nikke.jpg",
    tasks: ["完成每日任务", "完成同步器", "完成拦截战", "领取免费商店奖励"]
  }
];

export const DEFAULT_CATALOG_IDS = [
  "honkai-star-rail",
  "wuthering-waves",
  "arknights-endfield"
] as const;

export function normalizeComparableName(name: string): string {
  return name.trim().normalize("NFKC").replace(/\s+/g, "").toLocaleLowerCase("zh-CN");
}

export function getCatalogEntry(catalogId: string | null | undefined): GameCatalogEntry | null {
  if (!catalogId) {
    return null;
  }
  return GAME_CATALOG.find((entry) => entry.id === catalogId) ?? null;
}

export function findCatalogEntryByName(name: string): GameCatalogEntry | null {
  const comparableName = normalizeComparableName(name);
  return (
    GAME_CATALOG.find((entry) => {
      const names = [entry.name, ...entry.aliases];
      return names.some((candidate) => normalizeComparableName(candidate) === comparableName);
    }) ?? null
  );
}

export function getCatalogEntryForGame(game: Game): GameCatalogEntry | null {
  return getCatalogEntry(game.catalogId) ?? findCatalogEntryByName(game.name);
}

export function createTasksForCatalog(entry: GameCatalogEntry, now = new Date()): GameTask[] {
  const createdAt = now.toISOString();
  return entry.tasks.map((name, index) => ({
    id: `task-${index + 1}`,
    name,
    createdAt
  }));
}

export function createGameFromCatalog(
  entry: GameCatalogEntry,
  now = new Date(),
  id: string = globalThis.crypto?.randomUUID?.() ?? `game-${now.getTime()}-${Math.random().toString(36).slice(2)}`
): Game {
  return {
    id,
    catalogId: entry.id,
    name: entry.name,
    createdAt: now.toISOString(),
    archivedAt: null,
    tasks: createTasksForCatalog(entry, now)
  };
}