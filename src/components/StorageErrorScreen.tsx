import { useState } from "react";
import { SparkleIcon } from "./Icons";

interface StorageErrorScreenProps {
  message: string;
  onReset: () => string | null;
}

export function StorageErrorScreen({ message, onReset }: StorageErrorScreenProps) {
  const [resetError, setResetError] = useState<string | null>(null);

  const handleReset = () => {
    const error = onReset();
    if (error) {
      setResetError(error);
    }
  };

  return (
    <main className="error-screen">
      <div className="error-card">
        <span className="error-icon" aria-hidden="true">
          <SparkleIcon width="28" height="28" />
        </span>
        <p className="section-kicker">本地数据保护</p>
        <h1>暂时无法读取打卡数据</h1>
        <p>{message}</p>
        <p className="error-note">为避免覆盖原记录，页面已暂停自动保存。</p>
        <div className="error-actions">
          <button className="button button-ghost" onClick={() => window.location.reload()} type="button">
            重新加载
          </button>
          <button
            className="button button-danger"
            onClick={() => {
              if (window.confirm("确定重置本地数据吗？此操作无法撤销。")) {
                handleReset();
              }
            }}
            type="button"
          >
            重置本地数据
          </button>
        </div>
        {resetError ? <p className="field-error" role="alert">{resetError}</p> : null}
      </div>
    </main>
  );
}