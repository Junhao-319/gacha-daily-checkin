import { useMemo } from "react";
import {
  formatCompletionTime,
  formatDateLabel,
  fromDateKey,
  getRollingDateKeys
} from "../lib/date";
import { getGameColor, getGameInitial } from "../lib/games";
import { getCompletedGameCount, getCompletedTaskCount, getTaskProgress } from "../lib/state";
import type { PersistedStateV3 } from "../types";

interface HistoryHeatmapProps {
  state: PersistedStateV3;
  todayKey: string;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function HistoryHeatmap({
  state,
  todayKey,
  selectedDate,
  onSelectDate
}: HistoryHeatmapProps) {
  const dateKeys = useMemo(
    () => getRollingDateKeys(fromDateKey(todayKey)),
    [todayKey]
  );
  const leadingCells = fromDateKey(dateKeys[0]).getDay();
  const selectedGames = useMemo(
    () =>
      state.games
        .map((game) => {
          const progress = getTaskProgress(state, game, selectedDate);
          const completedTimes = game.tasks
            .map((task) => state.checkIns[game.id]?.[selectedDate]?.[task.id])
            .filter((value): value is string => Boolean(value))
            .sort();
          return {
            game,
            progress,
            completedAt: completedTimes.at(-1)
          };
        })
        .filter((entry) => entry.progress.completed > 0)
        .sort((left, right) => left.progress.ratio - right.progress.ratio || left.game.name.localeCompare(right.game.name, "zh-CN")),
    [selectedDate, state]
  );
  const completedGameCount = getCompletedGameCount(state, selectedDate);
  const completedTaskCount = getCompletedTaskCount(state, selectedDate);

  return (
    <section className="history-section" aria-labelledby="history-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">坚持轨迹</p>
          <h2 id="history-heading">最近 126 天</h2>
          <p className="section-description">颜色越深，完整完成的游戏越多。点击任一日期查看任务明细。</p>
        </div>
        <div className="heatmap-legend" aria-label="完成游戏数量图例">
          <span>少</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i className={`heat-cell level-${level}`} key={level} />
          ))}
          <span>多</span>
        </div>
      </div>

      <div className="history-card">
        <div className="heatmap-layout">
          <div aria-hidden="true" className="heatmap-weekdays">
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={label}>{index % 2 === 0 ? label : ""}</span>
            ))}
          </div>
          <div className="heatmap-scroll">
            <div className="heatmap-grid">
              {Array.from({ length: leadingCells }, (_, index) => (
                <span aria-hidden="true" className="heat-cell is-empty" key={`leading-${index}`} />
              ))}
              {dateKeys.map((dateKey) => {
                const count = getCompletedGameCount(state, dateKey);
                const level = Math.min(count, 4);
                return (
                  <button
                    aria-current={dateKey === todayKey ? "date" : undefined}
                    aria-label={`${formatDateLabel(dateKey)}，完整完成 ${count} 款游戏`}
                    className={`heat-cell level-${level}${dateKey === selectedDate ? " is-selected" : ""}`}
                    key={dateKey}
                    onClick={() => onSelectDate(dateKey)}
                    title={`${formatDateLabel(dateKey)} · 完整完成 ${count} 款`}
                    type="button"
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="day-detail" aria-live="polite">
          <div className="day-detail-heading">
            <div>
              <p className="section-kicker">{selectedDate === todayKey ? "今天" : "历史明细"}</p>
              <h3>{formatDateLabel(selectedDate)}</h3>
            </div>
            <span className="day-count">{completedGameCount} 款完整</span>
          </div>
          <p className="day-task-summary">{completedTaskCount} 项任务已完成</p>

          {selectedGames.length > 0 ? (
            <div className="completion-list">
              {selectedGames.map(({ game, progress, completedAt }) => (
                <div className="completion-row" key={game.id}>
                  <span
                    aria-hidden="true"
                    className="completion-avatar"
                    style={{ "--game-color": getGameColor(game.id) } as React.CSSProperties}
                  >
                    {getGameInitial(game.name)}
                  </span>
                  <span className="completion-name">
                    <strong>{game.name}</strong>
                    <small>
                      {progress.completed}/{progress.total} 项
                      {game.archivedAt ? " · 已取消" : ""}
                    </small>
                  </span>
                  {completedAt ? <time dateTime={completedAt}>{formatCompletionTime(completedAt)}</time> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="day-empty">
              <span aria-hidden="true">—</span>
              <p>这一天还没有任务完成记录。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
