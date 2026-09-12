import { CheckIcon } from "./Icons";
import { getPublicAssetUrl } from "../lib/assets";
import { getCatalogEntryForGame } from "../lib/gameCatalog";
import { getGameAccent, getGameArtworkPath, getGameInitial } from "../lib/games";
import type { Game } from "../types";

interface GameCardProps {
  game: Game;
  completed: number;
  total: number;
  onOpen: () => void;
}

export function GameCard({ game, completed, total, onOpen }: GameCardProps) {
  const artworkUrl = getPublicAssetUrl(getGameArtworkPath(game));
  const accent = getGameAccent(game);
  const catalogEntry = getCatalogEntryForGame(game);
  const isComplete = total > 0 && completed === total;
  const progress = total === 0 ? 0 : completed / total;

  return (
    <button
      aria-label={`打开 ${game.name}，已完成 ${completed}/${total}`}
      className={`game-card${isComplete ? " is-complete" : ""}`}
      onClick={onOpen}
      style={
        {
          "--game-color": accent,
          "--game-progress": progress,
          "--game-artwork": artworkUrl ? `url("${artworkUrl}")` : "none"
        } as React.CSSProperties
      }
      type="button"
    >
      <span className="game-card-art" aria-hidden="true" />
      <span className="game-card-overlay" aria-hidden="true" />
      <span className="game-avatar" aria-hidden="true">
        {getGameInitial(game.name)}
      </span>
      <span className="game-card-copy">
        <small>{catalogEntry?.publisher ?? "自定义游戏"}</small>
        <strong>{game.name}</strong>
        <span className="game-card-tasks">
          {completed}/{total} 项任务
        </span>
      </span>
      <span className="game-check" aria-hidden="true">
        {isComplete ? <CheckIcon width="17" height="17" /> : `${Math.round(progress * 100)}%`}
      </span>
    </button>
  );
}