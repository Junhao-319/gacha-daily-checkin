import { useEffect, useState } from "react";
import { millisecondsUntilNextMidnight, toDateKey } from "../lib/date";

export function useTodayKey(): string {
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    let timer: number | undefined;

    const refreshToday = () => {
      setTodayKey(toDateKey(new Date()));

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(refreshToday, millisecondsUntilNextMidnight(new Date()));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshToday();
      }
    };

    refreshToday();
    window.addEventListener("focus", refreshToday);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
      window.removeEventListener("focus", refreshToday);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return todayKey;
}