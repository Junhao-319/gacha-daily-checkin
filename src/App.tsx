import { useEffect, useRef, useState } from "react";
import { AddGameDialog } from "./components/AddGameDialog";
import { BackgroundDialog } from "./components/BackgroundDialog";
import { ClickEffect } from "./components/ClickEffect";
import { GlobalBackground } from "./components/GlobalBackground";
import { GameCard } from "./components/GameCard";
import { GameDetail } from "./components/GameDetail";
import { HistoryHeatmap } from "./components/HistoryHeatmap";
import { HomeInsights } from "./components/HomeInsights";
import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  ImageIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  SettingsIcon,
  SparkleIcon,
  SunIcon
} from "./components/Icons";
import { ManageGamesDialog } from "./components/ManageGamesDialog";
import { StorageErrorScreen } from "./components/StorageErrorScreen";
import { TaskManagerDialog } from "./components/TaskManagerDialog";
import { useAppState } from "./hooks/useAppState";
import { useDetectedGames } from "./hooks/useDetectedGames";
import { useWallpapers } from "./hooks/useWallpapers";
import { useTheme } from "./hooks/useTheme";
import { useTodayKey } from "./hooks/useTodayKey";
import { formatDateHeading, fromDateKey } from "./lib/date";
import {
  createGameFromCatalog,
  GAME_CATALOG,
  type GameCatalogEntry
} from "./lib/gameCatalog";
import { createCustomGame, createTask } from "./lib/games";
import { getActiveGames, getTaskProgress, isGameCompleted } from "./lib/state";
import type { ThemeMode } from "./types";

const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"];

function getThemeIcon(theme: ThemeMode) {
  if (theme === "light") return SunIcon;
  if (theme === "dark") return MoonIcon;
  return MonitorIcon;
}

function getThemeLabel(theme: ThemeMode): string {
  if (theme === "light") return "浅色";
  if (theme === "dark") return "深色";
  return "跟随系统";
}

function findCatalogEntry(catalogId: string): GameCatalogEntry | null {
  return GAME_CATALOG.find((entry) => entry.id === catalogId) ?? null;
}

export default function App() {
  const { state, dispatch, storageError, resetData } = useAppState();
  const detectedCatalogIds = useDetectedGames();
  const { wallpapers, loading: wallpapersLoading } = useWallpapers();
  const todayKey = useTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [taskManagerOpen, setTaskManagerOpen] = useState(false);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);
  const [backgroundDialogTarget, setBackgroundDialogTarget] = useState<'global' | { gameId: string } | null>(null);
  const detectionHandled = useRef(false);

  useTheme(state.theme);

  useEffect(() => {
    setSelectedDate(todayKey);
  }, [todayKey]);

  useEffect(() => {
    if (detectionHandled.current || detectedCatalogIds.length === 0) return;
    detectionHandled.current = true;
    const existingCatalogIds = new Set(
      state.games.map((game) => game.catalogId).filter((value): value is string => Boolean(value))
    );
    const missing = detectedCatalogIds
      .map(findCatalogEntry)
      .filter((entry): entry is GameCatalogEntry => Boolean(entry))
      .filter((entry) => !existingCatalogIds.has(entry.id));

    for (const entry of missing) {
      dispatch({ type: "add-game", game: createGameFromCatalog(entry) });
    }

    setDetectionNotice(
      missing.length > 0
        ? `已自动识别并加入本机安装的 ${missing.length} 款游戏。`
        : `已识别到本机安装的 ${detectedCatalogIds.length} 款游戏。`
    );
  }, [detectedCatalogIds, dispatch, state.games]);

  if (storageError) {
    return <StorageErrorScreen message={storageError} onReset={resetData} />;
  }

  const activeGames = getActiveGames(state);
  const completedGames = activeGames.filter((game) => isGameCompleted(state, game, todayKey));
  const completedGameCount = completedGames.length;
  const activeGameCount = activeGames.length;
  const gameProgress = activeGameCount === 0 ? 0 : completedGameCount / activeGameCount;
  const allGamesComplete = activeGameCount > 0 && completedGameCount === activeGameCount;
  const ThemeIcon = getThemeIcon(state.theme);
  const selectedGame = selectedGameId
    ? state.games.find((game) => game.id === selectedGameId && game.archivedAt === null) ?? null
    : null;

  const cycleTheme = () => {
    const currentIndex = THEME_ORDER.indexOf(state.theme);
    const nextTheme = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
    dispatch({ type: "set-theme", theme: nextTheme });
  };

  const toggleTask = (gameId: string, taskId: string) => {
    dispatch({
      type: "toggle-task",
      gameId,
      taskId,
      dateKey: todayKey,
      completedAt: new Date().toISOString()
    });
  };
  const renderDashboard = () => (
    <main>
      {detectionNotice ? (
        <div className="detection-banner" role="status">
          <span className="detection-banner-icon" aria-hidden="true">
            <SparkleIcon width="18" height="18" />
          </span>
          <span>
            <strong>桌面版检测完成</strong>
            <small>{detectionNotice}</small>
          </span>
          <button
            aria-label="关闭检测提示"
            className="detection-dismiss"
            onClick={() => setDetectionNotice(null)}
            type="button"
          >
            <CloseIcon width="17" height="17" />
          </button>
        </div>
      ) : null}

      <section className="today-card" aria-labelledby="today-heading">
        <div className="today-copy">
          <div className="today-date">
            <CalendarIcon width="17" height="17" />
            <span>{formatDateHeading(fromDateKey(todayKey))}</span>
          </div>
          <h1 id="today-heading">
            {activeGameCount === 0
              ? "先添加想坚持的游戏"
              : allGamesComplete
                ? "今天圆满收工"
                : "今天也慢慢来"}
          </h1>
          <p>
            {activeGameCount === 0
              ? "从游戏库选择一款游戏，系统会自动带入对应的日常任务。"
              : allGamesComplete
                ? "今天所有游戏的任务都完成了，好好休息吧。"
                : `已完整完成 ${completedGameCount} 款游戏，还有 ${activeGameCount - completedGameCount} 款等你收尾。`}
          </p>
        </div>

        <div className="progress-cluster">
          <div
            aria-label={`今日游戏完成进度：${completedGameCount} / ${activeGameCount}`}
            aria-valuemax={activeGameCount}
            aria-valuemin={0}
            aria-valuenow={completedGameCount}
            className={`progress-ring${allGamesComplete ? " is-complete" : ""}`}
            role="progressbar"
            style={{ "--progress-angle": `${gameProgress * 360}deg` } as React.CSSProperties}
          >
            <span>
              <strong>{completedGameCount}</strong>
              <small>/ {activeGameCount}</small>
            </span>
          </div>
          <span className="progress-label">
            {allGamesComplete ? <SparkleIcon width="16" height="16" /> : null}
            {allGamesComplete ? "全部完成" : "游戏进度"}
          </span>
        </div>
      </section>

      <HomeInsights activeGames={activeGames} dateKey={todayKey} />

      <section className="today-games" aria-labelledby="today-games-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">今日游戏</p>
            <h2 id="today-games-heading">选择一款继续</h2>
            <p className="section-description">每款游戏都有独立任务清单，点击卡片进入专属页面。</p>
          </div>
          <button
            className="button button-primary add-button"
            onClick={() => setAddDialogOpen(true)}
            type="button"
          >
            <PlusIcon width="18" height="18" />
            添加游戏
          </button>
        </div>

        {activeGames.length > 0 ? (
          <div className="game-grid">
            {activeGames.map((game) => {
              const progress = getTaskProgress(state, game, todayKey);
              return (
                <GameCard
                  completed={progress.completed}
                  game={game}
                  key={game.id}
                  onOpen={() => {
                    setSelectedGameId(game.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  total={progress.total}
                />
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              <PlusIcon width="24" height="24" />
            </span>
            <h3>今日清单还是空的</h3>
            <p>从主流二游库选择游戏，每个游戏都会有自己的任务清单。</p>
            <button
              className="button button-primary"
              onClick={() => setAddDialogOpen(true)}
              type="button"
            >
              添加第一款游戏
            </button>
          </div>
        )}
      </section>

      <HistoryHeatmap
        onSelectDate={setSelectedDate}
        selectedDate={selectedDate}
        state={state}
        todayKey={todayKey}
      />
    </main>
  );
  return (
    <div className="app-shell">
      <ClickEffect />
      <GlobalBackground preference={state.backgrounds.homeCustomEnabled ? state.backgrounds.global : null} />
      <div className="ambient-glow ambient-glow-one" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-two" aria-hidden="true" />

      <header className="topbar">
        <a
          className="brand"
          href="./"
          aria-label="次元日常首页"
          onClick={(event) => {
            if (selectedGame) {
              event.preventDefault();
              setSelectedGameId(null);
            }
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            <CheckIcon width="22" height="22" />
          </span>
          <span>
            <small>DAILY CHECK-IN</small>
            <strong>次元日常</strong>
          </span>
        </a>

        <nav className="topbar-actions" aria-label="页面操作">
          <button
            aria-label="更换页面背景"
            className="icon-button"
            onClick={() => setBackgroundDialogTarget('global')}
            title="更换页面背景"
            type="button"
          >
            <ImageIcon />
          </button>
          <button
            aria-label={`当前主题：${getThemeLabel(state.theme)}，点击切换`}
            className="icon-button"
            onClick={cycleTheme}
            title={`主题：${getThemeLabel(state.theme)}`}
            type="button"
          >
            <ThemeIcon />
          </button>
          <button
            aria-label="管理游戏与外观"
            className="icon-button"
            onClick={() => setManageDialogOpen(true)}
            title="管理"
            type="button"
          >
            <SettingsIcon />
          </button>
        </nav>
      </header>

      {selectedGame ? (
        <main>
          <GameDetail
            dateKey={todayKey}
            game={selectedGame}
            onBack={() => setSelectedGameId(null)}
            onManageTasks={() => setTaskManagerOpen(true)}
            backgroundPreference={state.backgrounds.games[selectedGame.id] ?? null}
            onChangeBackground={() => setBackgroundDialogTarget({ gameId: selectedGame.id })}
            onToggleTask={(taskId) => toggleTask(selectedGame.id, taskId)}
            state={state}
          />
        </main>
      ) : (
        renderDashboard()
      )}

      <footer className="page-footer">
        <span>数据仅保存在此浏览器</span>
        <span aria-hidden="true">·</span>
        <span>每天 00:00 自动开启新的一天</span>
      </footer>

      <AddGameDialog
        detectedCatalogIds={detectedCatalogIds}
        games={state.games}
        onAddCatalog={(entry) => dispatch({ type: "add-game", game: createGameFromCatalog(entry) })}
        onAddCustom={(name) => dispatch({ type: "add-game", game: createCustomGame(name) })}
        onClose={() => setAddDialogOpen(false)}
        open={addDialogOpen}
      />
      <ManageGamesDialog
        games={state.games}
        onArchive={(gameId) => {
          if (selectedGameId === gameId) {
            setSelectedGameId(null);
          }
          dispatch({ type: "archive-game", gameId, archivedAt: new Date().toISOString() });
        }}
        onClose={() => setManageDialogOpen(false)}
        onRename={(gameId, name) => dispatch({ type: "rename-game", gameId, name })}
        onRestore={(gameId) => dispatch({ type: "restore-game", gameId })}
        onThemeChange={(theme) => dispatch({ type: "set-theme", theme })}
        open={manageDialogOpen}
        theme={state.theme}
      />
      <TaskManagerDialog
        game={selectedGame}
        onAdd={(name) =>
          selectedGame && dispatch({ type: "add-task", gameId: selectedGame.id, task: createTask(name) })
        }
        onClose={() => setTaskManagerOpen(false)}
        onRemove={(taskId) =>
          selectedGame && dispatch({ type: "remove-task", gameId: selectedGame.id, taskId })
        }
        onRename={(taskId, name) =>
          selectedGame && dispatch({ type: "rename-task", gameId: selectedGame.id, taskId, name })
        }
        open={taskManagerOpen}
      />
      <BackgroundDialog
        current={
          backgroundDialogTarget === 'global'
            ? state.backgrounds.homeCustomEnabled
              ? state.backgrounds.global
              : null
            : backgroundDialogTarget
              ? state.backgrounds.games[backgroundDialogTarget.gameId] ?? null
              : null
        }
        onApply={(background) => {
          if (backgroundDialogTarget) {
            dispatch({ type: 'set-background', target: backgroundDialogTarget, background });
          }
        }}
        onClose={() => setBackgroundDialogTarget(null)}
        open={backgroundDialogTarget !== null}
        targetLabel={backgroundDialogTarget === 'global' ? '今日页背景' : selectedGame?.name ?? '游戏背景'}
        wallpapers={wallpapers}
        wallpapersLoading={wallpapersLoading}
      />
    </div>
  );
}
