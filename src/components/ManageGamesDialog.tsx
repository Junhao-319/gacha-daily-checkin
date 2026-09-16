import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import {
  CheckIcon,
  CloseIcon,
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
  onCancelToday: (gameId: string) => void;
  onRestore: (gameId: string) => void;
  privateGalleryUnlocked: boolean;
  onUnlockPrivateGallery: () => void;
}

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: typeof SunIcon }> = [
  { value: "system", label: "跟随系统", icon: MonitorIcon },
  { value: "light", label: "浅色", icon: SunIcon },
  { value: "dark", label: "深色", icon: MoonIcon }
];

const PRIVATE_GALLERY_PASSWORD = import.meta.env.VITE_PRIVATE_GALLERY_PASSWORD ?? "";

export function ManageGamesDialog({
  open,
  games,
  theme,
  onClose,
  onThemeChange,
  onRename,
  onCancelToday,
  onRestore,
  privateGalleryUnlocked,
  onUnlockPrivateGallery
}: ManageGamesDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [galleryPassword, setGalleryPassword] = useState("");
  const [galleryPasswordError, setGalleryPasswordError] = useState<string | null>(null);
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

  const unlockPrivateGallery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!PRIVATE_GALLERY_PASSWORD || galleryPassword !== PRIVATE_GALLERY_PASSWORD) {
      setGalleryPasswordError("密码不正确，请重试。");
      return;
    }
    setGalleryPassword("");
    setGalleryPasswordError(null);
    onUnlockPrivateGallery();
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
                  ? `${formatShortMonthDay(toDateKey(new Date(game.archivedAt)))}已取消`
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
                  aria-label={`取消今日游戏 ${game.name}`}
                  className="mini-action cancel-game-action"
                  onClick={() => {
                    if (window.confirm(`取消「${game.name}」的今日游戏？历史打卡记录会保留，之后可随时恢复。`)) {
                      onCancelToday(game.id);
                    }
                  }}
                  title="取消今日游戏"
                  type="button"
                >
                  <CloseIcon width="17" height="17" />
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
      description="取消今日游戏只会移出今日清单，过去的打卡记录会继续保留，之后可随时恢复。"
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

        <section className="manage-section private-gallery-unlock" aria-labelledby="private-gallery-unlock-heading">
          <div className="manage-section-heading">
            <div>
              <p className="section-kicker">专属内容</p>
              <h3 id="private-gallery-unlock-heading">私密图集</h3>
            </div>
            <span className={`gallery-lock-status${privateGalleryUnlocked ? " is-unlocked" : ""}`}>
              {privateGalleryUnlocked ? "已解锁" : "未解锁"}
            </span>
          </div>
          {privateGalleryUnlocked ? (
            <p className="manage-empty">专属图集已解锁。打开右上角的背景设置，即可选择并启用。</p>
          ) : (
            <form className="gallery-unlock-form" onSubmit={unlockPrivateGallery}>
              <label>
                <span>访问密码</span>
                <input
                  aria-label="专属图集访问密码"
                  autoComplete="off"
                  onChange={(event) => {
                    setGalleryPassword(event.target.value);
                    setGalleryPasswordError(null);
                  }}
                  placeholder="输入密码后解锁"
                  type="password"
                  value={galleryPassword}
                />
              </label>
              <button className="button button-primary" type="submit">解锁图集</button>
              {galleryPasswordError ? <p className="field-error" role="alert">{galleryPasswordError}</p> : null}
            </form>
          )}
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
              <h3 id="archived-games-heading">已取消 · {archivedGames.length}</h3>
            </div>
          </div>
          <div className="manage-list">
            {archivedGames.length > 0 ? (
              archivedGames.map((game) => renderGameRow(game, true))
            ) : (
              <p className="manage-empty">暂无已取消的游戏。</p>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
