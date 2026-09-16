import { useState } from "react";
import { getGameAccent, getGameInitial } from "../lib/games";
import { getDailyGameTip, getDailyQuote } from "../lib/homeContent";
import type { Game } from "../types";

interface HomeInsightsProps {
  activeGames: Game[];
  dateKey: string;
}

export function HomeInsights({ activeGames, dateKey }: HomeInsightsProps) {
  const [quoteOffset, setQuoteOffset] = useState(0);
  const quote = getDailyQuote(dateKey, quoteOffset);
  const visibleGames = activeGames.slice(0, 3);

  return (
    <section className="home-insights" aria-label="今日内容">
      <article className="quote-card" aria-label="每日名人名言">
        <span className="quote-orbit quote-orbit-one" aria-hidden="true" />
        <span className="quote-orbit quote-orbit-two" aria-hidden="true" />
        <span className="quote-mark" aria-hidden="true">“</span>
        <img alt="" aria-hidden="true" className="quote-character" src="/quote-art/anime-quote-companion.png" />
        <div className="quote-copy">
          <div className="quote-topline">
            <p className="section-kicker">DAILY QUOTE</p>
            <span className="quote-chip">{quote.tag}</span>
          </div>
          <blockquote>{quote.text}</blockquote>
          <footer className="quote-footer">
            <cite>— {quote.author}</cite>
            <button
              aria-label="换一句名言"
              className="quote-refresh"
              onClick={() => setQuoteOffset((offset) => offset + 1)}
              title="换一句"
              type="button"
            >
              <span aria-hidden="true">↻</span>
              换一句
            </button>
          </footer>
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
