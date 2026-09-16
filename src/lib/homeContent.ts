import { getCatalogEntryForGame } from "./gameCatalog";
import type { Game } from "../types";

const DAILY_QUOTES = [
  { text: "千里之行，始于足下。", author: "老子", tag: "从这一格开始" },
  { text: "不积跬步，无以至千里。", author: "荀子", tag: "微小进度，也算前进" },
  { text: "道阻且长，行则将至。", author: "《荀子》", tag: "缓慢但持续" },
  { text: "凡是过往，皆为序章。", author: "莎士比亚", tag: "今天是新章节" },
  { text: "纵有疾风起，人生不言弃。", author: "保罗·瓦雷里", tag: "把风留在身后" },
  { text: "真正的发现之旅，不在于寻找新风景，而在于拥有新眼光。", author: "马塞尔·普鲁斯特", tag: "换个角度看今天" },
  { text: "我们必须接受失望，因为它是有限的；但千万不可失去希望，因为它是无穷的。", author: "马丁·路德·金", tag: "希望仍在加载" },
  { text: "你不必很厉害才开始，但你要开始才会很厉害。", author: "齐格·齐格拉", tag: "从现在开始" }
];

const GAME_TIPS: Record<string, string[]> = {
  "honkai-impact-3rd": ["先清体力再处理开放世界委托，通常能减少来回切换。", "家园与乐土奖励可以放在每日任务之后统一领取。"],
  "genshin-impact": ["每日委托建议按区域集中完成，顺路采集效率更高。", "周本和树脂活动可以放在周末统一规划。"],
  "honkai-star-rail": ["开拓力接近上限时先刷材料，避免自然恢复被浪费。", "派遣、邮件和无名勋礼可以最后一次统一收取。"],
  "zenless-zone-zero": ["每日委托和电量消耗优先完成，再处理录像店经营。", "刮刮卡和报纸每天都能顺手领，不要遗忘。"],
  "wuthering-waves": ["先完成每日活跃，再安排结晶波片和声骸路线。", "每周声骸强化材料可以按角色培养列表集中整理。"],
  "arknights-endfield": ["基建产出、理智消耗和日常委托建议固定顺序完成。", "先处理限时活动，再做可长期累积的日常任务。"],
  "arknights": ["理智快满时优先清理活动关卡，其次再补常规材料。", "基建换班和信用商店适合放在每日收尾阶段。"],
  "blue-archive": ["咖啡厅体力会溢出，登录后优先领取。", "战术对抗赛每天打满，长期收益比临时冲刺更稳。"],
  "reverse-1999": ["荒原产物和迷思海可以一起处理，减少重复切页。", "活动商店优先兑换稀缺养成材料。"],
  "infinite-nikki": ["体力、祝福闪光和每日任务可以按固定路线完成。", "遇到拍照任务时顺便探索，能节省重复跑图时间。"],
  "love-and-deepspace": ["每日互动和体力消耗优先完成，再领取签到奖励。", "活动期间先完成限时任务，再补长期养成。"],
  "onmyoji": ["结界、悬赏和每日任务集中完成，效率会更高。", "活动体力与日常体力建议分时段安排。"],
  "fate-grand-order": ["AP快满时优先完成活动周回，避免体力浪费。", "种火和QP按当前从者培养计划轮换更高效。"],
  "path-to-nowhere": ["先做监管事件，再集中处理破碎防线。", "体力药建议留给活动高收益关卡。"],
  "nikke": ["同步器、拦截战和免费商店是稳定的日收益。", "先完成限时活动，再做可累计的日常内容。"],
  "default": ["先完成限时任务，再处理可以长期积累的日常内容。", "把最容易遗忘的奖励固定在最后一个步骤领取。"]
};

function hashText(value: string): number {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash;
}

export function getDailyQuote(dateKey: string, offset = 0) {
  return DAILY_QUOTES[(hashText(dateKey) + offset) % DAILY_QUOTES.length];
}

export function getDailyGameTip(game: Game, dateKey: string): string {
  const catalogId = getCatalogEntryForGame(game)?.id ?? "default";
  const tips = GAME_TIPS[catalogId] ?? GAME_TIPS.default;
  return tips[hashText(`${dateKey}-${game.id}`) % tips.length];
}
