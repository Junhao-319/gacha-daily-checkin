import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import {
  ArchiveIcon,
  CheckIcon,
  MonitorIcon,
  MoonIcon,
  PencilIcon,
  RestoreIcon,
  SunIcon
} from "./Icons";
import { formatShortMonthDay, toDateKey } from "../lib/date";
import { getGameColor, getGameInitial, getGameNameError, normalizeGameName } from "../lib/games";
import type { Game, ThemeMode } from "../types";

interface ManageGamesDialogProps {
  open: boolean;
  games: Game[];
  theme: ThemeMode;
  onClose: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  onRename: (gameId: string, name: string) => void;
  onArchive: (gameId: string) => void;
  onRestore: (gameId: string) => void;
}

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: typeof SunIcon }> = [
  { value: "system", label: "跟随系统", icon: MonitorIcon },
  { value: "light", label: "浅色", icon: SunIcon },
  { value: "dark", label: "深色", icon: MoonIcon }
];

export function ManageGamesDialog({
  open,
  games,
  theme,
  onClose,
  onThemeChange,
  onRename,
  onArchive,
  onRestore
}: ManageGamesDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const activeGames = games.filter((game) => game.archivedAt === null);
  const archivedGames = games.filter((game) => game.archivedAt !== null);

  const startEditing = (game: Game) => {
    setEditingId(game.id);
    setDraftName(game.name);
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftName("");
    setEditError(null);
  };

  const submitRename = (event: FormEvent<HTMLFormElement>, gameId: string) => {
    event.preventDefault();
    const error = getGameNameError(draftName, games, gameId);
    if (error) {
      setEditError(error);
      return;
    }

    onRename(gameId, normalizeGameName(draftName));
    cancelEditing();
  };

  const renderGameRow = (game: Game, archived: boolean) => {
    const isEditing = editingId === game.id;

    return (
      <div className="manage-row" key={game.id}>
        <span
          aria-hidden="true"
          className="manage-avatar"
          style={{ "--game-color": getGameColor(game.id) } as React.CSSProperties}
        >
          {getGameInitial(game.name)}
        </span>

        {isEditing ? (
          <form className="manage-edit-form" onSubmit={(event) => submitRename(event, game.id)}>
            <input
              aria-label={`修改 ${game.name} 的名称`}
              aria-invalid={Boolean(editError)}
              maxLength={31}
              onChange={(event) => {
                setDraftName(event.target.value);
                setEditError(null);
              }}
              value={draftName}
            />
            <button aria-label="保存名称" className="mini-action is-primary" title="保存" type="submit">
              <CheckIcon width="17" height="17" />
            </button>
            <button className="text-action" onClick={cancelEditing} type="button">
              取消
            </button>
            {editError ? <span className="manage-edit-error">{editError}</span> : null}
          </form>
        ) : (
          <>
            <span className="manage-name">
              <strong>{game.name}</strong>
              <small>
                {archived && game.archivedAt
                  ? `${formatShortMonthDay(toDateKey(new Date(game.archivedAt)))}归档`
                  : "当前进行中"}
              </small>
            </span>
            <span className="manage-actions">
              <button
                aria-label={`修改 ${game.name} 的名称`}
                className="mini-action"
                onClick={() => startEditing(game)}
                title="改名"
                type="button"
              >
                <PencilIcon width="17" height="17" />
              </button>
              {archived ? (
                <button
                  aria-label={`恢复 ${game.name}`}
                  className="mini-action restore-action"
                  onClick={() => onRestore(game.id)}
                  title="恢复"
                  type="button"
                >
                  <RestoreIcon width="17" height="17" />
                </button>
              ) : (
                <button
                  aria-label={`归档 ${game.name}`}
                  className="mini-action"
                  onClick={() => onArchive(game.id)}
                  title="归档"
                  type="button"
                >
                  <ArchiveIcon width="17" height="17" />
                </button>
              )}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <Modal
      description="归档只移出今日进度，过去的打卡记录会继续保留。"
      onClose={onClose}
      open={open}
      size="wide"
      title="管理游戏与外观"
    >
      <div className="manage-content">
        <section className="manage-section" aria-labelledby="theme-heading">
          <div className="manage-section-heading">
            <div>
              <p className="section-kicker">外观</p>
              <h3 id="theme-heading">页面主题</h3>
            </div>
          </div>
          <div className="theme-options">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  aria-pressed={theme === option.value}
                  className={`theme-option${theme === option.value ? " is-selected" : ""}`}
                  key={option.value}
                  onClick={() => onThemeChange(option.value)}
                  type="button"
                >
                  <Icon width="18" height="18" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="manage-section" aria-labelledby="active-games-heading">
          <div className="manage-section-heading">
            <div>
              <p className="section-kicker">正在进行</p>
              <h3 id="active-games-heading">今日游戏 · {activeGames.length}</h3>
            </div>
          </div>
          <div className="manage-list">
            {activeGames.length > 0 ? (
              activeGames.map((game) => renderGameRow(game, false))
            ) : (
              <p className="manage-empty">当前没有进行中的游戏。</p>
            )}
          </div>
        </section>

        <section className="manage-section" aria-labelledby="archived-games-heading">
          <div className="manage-section-heading">
            <div>
              <p className="section-kicker">历史保留</p>
              <h3 id="archived-games-heading">已归档 · {archivedGames.length}</h3>
            </div>
          </div>
          <div className="manage-list">
            {archivedGames.length > 0 ? (
              archivedGames.map((game) => renderGameRow(game, true))
            ) : (
              <p className="manage-empty">暂无归档游戏。</p>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}