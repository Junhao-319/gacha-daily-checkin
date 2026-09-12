import { getGameAccent, getGameInitial } from "../lib/games";
import { getDailyGameTip, getDailyQuote } from "../lib/homeContent";
import type { Game } from "../types";

interface HomeInsightsProps {
  activeGames: Game[];
  dateKey: string;
}

export function HomeInsights({ activeGames, dateKey }: HomeInsightsProps) {
  const quote = getDailyQuote(dateKey);
  const visibleGames = activeGames.slice(0, 3);

  return (
    <section className="home-insights" aria-label="今日内容">
      <article className="quote-card">
        <span className="quote-mark" aria-hidden="true">“</span>
        <div>
          <p className="section-kicker">今日寄语</p>
          <blockquote>{quote.text}</blockquote>
          <cite>— {quote.author}</cite>
        </div>
      </article>

      <div className="insight-stack">
        <div className="section-heading compact-heading">
          <div>
            <p className="section-kicker">游戏谈资</p>
            <h2>今天可以留意这些</h2>
          </div>
        </div>
        <div className="tip-list">
          {visibleGames.length > 0 ? (
            visibleGames.map((game) => (
              <article
                className="tip-card"
                key={game.id}
                style={{ "--tip-color": getGameAccent(game) } as React.CSSProperties}
              >
                <span className="tip-avatar" aria-hidden="true">{getGameInitial(game.name)}</span>
                <div>
                  <strong>{game.name}</strong>
                  <p>{getDailyGameTip(game, dateKey)}</p>
                </div>
              </article>
            ))
          ) : (
            <article className="tip-card tip-card-default">
              <span className="tip-avatar" aria-hidden="true">✦</span>
              <div>
                <strong>从一款喜欢的游戏开始</strong>
                <p>添加游戏后，这里会每天轮换不同的养成节奏和任务提醒。</p>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}