import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { PlusIcon } from "./Icons";
import { getArtworkUrls, useArtworkVersion } from "../lib/artworkSync";
import { GAME_CATALOG, type GameCatalogEntry } from "../lib/gameCatalog";
import { getGameNameError, normalizeGameName } from "../lib/games";
import type { Game } from "../types";

interface AddGameDialogProps {
  open: boolean;
  games: Game[];
  detectedCatalogIds: string[];
  onClose: () => void;
  onAddCatalog: (entry: GameCatalogEntry) => void;
  onAddCustom: (name: string) => void;
}

export function AddGameDialog({
  open,
  games,
  detectedCatalogIds,
  onClose,
  onAddCatalog,
  onAddCustom
}: AddGameDialogProps) {
  const remoteArtworkVersion = useArtworkVersion();
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customSubmitted, setCustomSubmitted] = useState(false);
  const customError = customSubmitted ? getGameNameError(customName, games) : null;
  const existingCatalogIds = new Set(games.map((game) => game.catalogId).filter(Boolean));

  useEffect(() => {
    if (open) {
      setQuery("");
      setCustomName("");
      setCustomSubmitted(false);
    }
  }, [open]);

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
    if (!normalizedQuery) {
      return GAME_CATALOG;
    }

    return GAME_CATALOG.filter((entry) => {
      const searchable = [entry.name, entry.publisher, entry.genre, ...entry.aliases]
        .join(" ")
        .toLocaleLowerCase("zh-CN");
      return searchable.includes(normalizedQuery);
    });
  }, [query]);

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCustomSubmitted(true);
    if (getGameNameError(customName, games)) {
      return;
    }

    onAddCustom(normalizeGameName(customName));
    onClose();
  };

  return (
    <Modal
      description="选择主流二游会自动带入对应日常任务；桌面启动器还会优先标记本机检测到的游戏。"
      onClose={onClose}
      open={open}
      size="wide"
      title="添加到今日清单"
    >
      <div className="catalog-search">
        <label className="field">
          <span>搜索游戏</span>
          <input
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入游戏名、厂商或类型"
            value={query}
          />
        </label>
      </div>

      <div className="catalog-section-heading">
        <div>
          <p className="section-kicker">主流二游库</p>
          <h3>{query ? `找到 ${filteredCatalog.length} 款` : `共 ${GAME_CATALOG.length} 款`}</h3>
        </div>
        {detectedCatalogIds.length > 0 ? (
          <span className="detected-summary">本机检测到 {detectedCatalogIds.length} 款</span>
        ) : null}
      </div>

      <div className="catalog-grid">
        {filteredCatalog.map((entry) => {
          const alreadyAdded = existingCatalogIds.has(entry.id);
          const detected = detectedCatalogIds.includes(entry.id);
          const { localUrl, remoteUrl } = getArtworkUrls(entry.artwork, remoteArtworkVersion);

          return (
            <button
              className={`catalog-item${detected ? " is-detected" : ""}`}
              disabled={alreadyAdded}
              key={entry.id}
              onClick={() => {
                onAddCatalog(entry);
                onClose();
              }}
              style={
                {
                  "--catalog-color": entry.accent,
                  "--catalog-artwork": remoteUrl ? `url("${remoteUrl}")` : "none",
                  "--catalog-artwork-fallback": localUrl ? `url("${localUrl}")` : "none"
                } as React.CSSProperties
              }
              type="button"
            >
              <span className="catalog-art" aria-hidden="true" />
              <span className="catalog-copy">
                <span className="catalog-badges">
                  <small>{entry.genre}</small>
                  {detected ? <em>本机已安装</em> : null}
                </span>
                <strong>{entry.name}</strong>
                <small>{entry.publisher} · {entry.tasks.length} 项日常</small>
              </span>
              <span className="catalog-add-icon" aria-hidden="true">
                {alreadyAdded ? "已添加" : <PlusIcon width="18" height="18" />}
              </span>
            </button>
          );
        })}
      </div>

      {filteredCatalog.length === 0 ? (
        <p className="catalog-no-results">没有匹配的预置游戏，可在下方作为自定义游戏添加。</p>
      ) : null}

      <form className="custom-game-form" onSubmit={handleCustomSubmit}>
        <div className="custom-game-heading">
          <p className="section-kicker">自定义</p>
          <h3>没有找到？手动添加</h3>
        </div>
        <div className="custom-game-row">
          <input
            aria-describedby={customError ? "custom-game-error" : undefined}
            aria-invalid={Boolean(customError)}
            onChange={(event) => {
              setCustomName(event.target.value);
              setCustomSubmitted(false);
            }}
            placeholder="输入完整游戏名称"
            value={customName}
          />
          <button className="button button-primary" type="submit">
            添加
          </button>
        </div>
        {customError ? (
          <p className="field-error" id="custom-game-error" role="alert">
            {customError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}