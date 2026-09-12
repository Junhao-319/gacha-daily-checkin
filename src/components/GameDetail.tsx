import { BackIcon, CheckIcon, ImageIcon, ListIcon, SparkleIcon } from "./Icons";
import { BackgroundMedia } from "./BackgroundMedia";
import { getPublicAssetUrl } from "../lib/assets";
import { getArtworkUrls, useArtworkVersion } from "../lib/artworkSync";
import { formatCompletionTime, formatDateHeading, fromDateKey } from "../lib/date";
import { getCatalogEntryForGame } from "../lib/gameCatalog";
import { getGameAccent, getGameArtworkPath, getGameInitial, getGameVideoArtworkPath } from "../lib/games";
import { getTaskCompletionTime, getTaskProgress } from "../lib/state";
import type { BackgroundPreference, Game, PersistedStateV3 } from "../types";

interface GameDetailProps {
  state: PersistedStateV3;
  game: Game;
  dateKey: string;
  onBack: () => void;
  onManageTasks: () => void;
  backgroundPreference: BackgroundPreference | null;
  onChangeBackground: () => void;
  onToggleTask: (taskId: string) => void;
}

export function GameDetail({
  state,
  game,
  dateKey,
  onBack,
  onManageTasks,
  backgroundPreference,
  onChangeBackground,
  onToggleTask
}: GameDetailProps) {
  const progress = getTaskProgress(state, game, dateKey);
  const remoteArtworkVersion = useArtworkVersion();
  const { localUrl, remoteUrl } = getArtworkUrls(getGameArtworkPath(game), remoteArtworkVersion);
  const defaultVideoUrl = getPublicAssetUrl(getGameVideoArtworkPath(game));
  const catalogEntry = getCatalogEntryForGame(game);
  const accent = getGameAccent(game);
  const allComplete = progress.total > 0 && progress.completed === progress.total;

  return (
    <section
      className="game-detail"
      style={
        {
          "--game-color": accent,
          "--game-artwork": remoteUrl ? `url("${remoteUrl}")` : "none",
          "--game-artwork-fallback": localUrl ? `url("${localUrl}")` : "none"
        } as React.CSSProperties
      }
    >
      <div className="game-detail-backdrop" aria-hidden="true" />
      {!backgroundPreference && defaultVideoUrl ? (
        <video
          autoPlay
          className="game-detail-default-media"
          loop
          muted
          playsInline
          poster={localUrl ?? undefined}
          src={defaultVideoUrl}
        />
      ) : null}
      <BackgroundMedia className="game-detail-custom-media" preference={backgroundPreference} />
      <div className="game-detail-shade" aria-hidden="true" />

      <header className="game-detail-header">
        <button className="detail-back-button" onClick={onBack} type="button">
          <BackIcon width="18" height="18" />
          返回今日清单
        </button>
        <div className="detail-header-actions">
          <button className="detail-background-button" onClick={onChangeBackground} type="button">
            <ImageIcon width="17" height="17" />
            更换背景
          </button>
          <div className="detail-date">{formatDateHeading(fromDateKey(dateKey))}</div>
        </div>
      </header>

      <div className="game-detail-hero">
        <div>
          <div className="detail-game-title">
            <span
              aria-hidden="true"
              className="detail-game-avatar"
              style={{ "--game-color": accent } as React.CSSProperties}
            >
              {getGameInitial(game.name)}
            </span>
            <div>
              <p>
                {catalogEntry?.publisher ?? "自定义游戏"} · {catalogEntry?.genre ?? "每日清单"}
              </p>
              <h1>{game.name}</h1>
            </div>
          </div>
          <p className="detail-subtitle">
            {allComplete ? "今天的任务全部完成，好好休息吧。" : "逐项完成今天的任务，全部勾选后会记为完整打卡。"}
          </p>
        </div>

        <div className={`detail-progress${allComplete ? " is-complete" : ""}`}>
          <span>{allComplete ? <SparkleIcon width="18" height="18" /> : null}</span>
          <strong>
            {progress.completed}
            <small> / {progress.total}</small>
          </strong>
          <p>{allComplete ? "今日完成" : "任务进度"}</p>
        </div>
      </div>

      <div className="task-panel">
        <div className="task-panel-heading">
          <div>
            <p className="section-kicker">{game.name}</p>
            <h2>今日任务清单</h2>
          </div>
          <button className="button task-manage-button" onClick={onManageTasks} type="button">
            <ListIcon width="17" height="17" />
            编辑任务
          </button>
        </div>

        <div className="task-list">
          {game.tasks.map((task, index) => {
            const completedAt = getTaskCompletionTime(state, game.id, task.id, dateKey);
            return (
              <button
                aria-pressed={Boolean(completedAt)}
                className={`task-row${completedAt ? " is-complete" : ""}`}
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                type="button"
              >
                <span className="task-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="task-copy">
                  <strong>{task.name}</strong>
                  <small>{completedAt ? `完成于 ${formatCompletionTime(completedAt)}` : "点击勾选完成"}</small>
                </span>
                <span className="task-check" aria-hidden="true">
                  <CheckIcon width="17" height="17" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}