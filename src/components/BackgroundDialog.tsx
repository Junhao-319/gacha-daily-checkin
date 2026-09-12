import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { ImageIcon, MonitorIcon } from "./Icons";
import { saveBackgroundAsset } from "../lib/backgroundAssets";
import type { BackgroundMediaType, BackgroundPreference, WallpaperItem } from "../types";

interface BackgroundDialogProps {
  open: boolean;
  targetLabel: string;
  current: BackgroundPreference | null;
  wallpapers: WallpaperItem[];
  wallpapersLoading: boolean;
  onClose: () => void;
  onApply: (preference: BackgroundPreference | null) => void;
}

export function BackgroundDialog({
  open,
  targetLabel,
  current,
  wallpapers,
  wallpapersLoading,
  onClose,
  onApply
}: BackgroundDialogProps) {
  const [url, setUrl] = useState("");
  const [urlMediaType, setUrlMediaType] = useState<BackgroundMediaType>("image");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl(current?.type === "url" ? current.value : "");
      setUrlMediaType(current?.mediaType ?? "image");
      setError(null);
      setUploading(false);
    }
  }, [current, open]);

  const applyAndClose = (preference: BackgroundPreference | null) => {
    onApply(preference);
    onClose();
  };

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      setError("请输入以 http:// 或 https:// 开头的图片或视频地址");
      return;
    }

    applyAndClose({
      type: "url",
      mediaType: urlMediaType,
      value: normalizedUrl,
      title: "自定义网络背景"
    });
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      setError("只支持图片或视频文件");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const assetId = await saveBackgroundAsset(file);
      applyAndClose({
        type: "upload",
        mediaType: isVideo ? "video" : "image",
        value: assetId,
        title: file.name
      });
    } catch {
      setError("保存背景文件失败，请检查浏览器存储空间");
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const images = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name))
      .slice(0, 40);
    if (images.length === 0) {
      setError("所选文件夹中没有可用的图片文件");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const assetIds: string[] = [];
      for (const file of images) {
        try {
          assetIds.push(await saveBackgroundAsset(file));
        } catch {
          // 跳过无法保存的单个文件，保留其余图集。
        }
      }
      if (assetIds.length === 0) {
        throw new Error("图集保存失败");
      }
      applyAndClose({
        type: "gallery",
        mediaType: "image",
        value: assetIds[0],
        assetIds,
        title: `本地图集 · ${assetIds.length} 张`
      });
    } catch {
      setError("保存本地图集失败，请检查图片格式或存储空间");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      description={`正在设置${targetLabel}。可使用 Wallpaper Engine 壁纸、上传文件或网络图片。`}
      onClose={onClose}
      open={open}
      size="wide"
      title="更换背景"
    >
      <div className="background-current">
        <div>
          <p className="section-kicker">当前设置</p>
          <strong>{current?.title ?? "动态游戏画廊"}</strong>
        </div>
        <button className="button button-ghost" onClick={() => applyAndClose(null)} type="button">
          恢复默认
        </button>
      </div>

      <section className="background-section" aria-labelledby="wallpaper-engine-heading">
        <div className="background-section-heading">
          <div>
            <p className="section-kicker">Steam Wallpaper Engine</p>
            <h3 id="wallpaper-engine-heading">本地动态壁纸</h3>
          </div>
          <span className="detected-summary">{wallpapers.length} 张可用</span>
        </div>

        {wallpapersLoading ? (
          <p className="background-empty">正在扫描 Wallpaper Engine...</p>
        ) : wallpapers.length > 0 ? (
          <div className="wallpaper-grid">
            {wallpapers.map((wallpaper) => (
              <button
                className={`wallpaper-item${current?.value === wallpaper.mediaUrl ? " is-selected" : ""}`}
                key={wallpaper.id}
                onClick={() =>
                  applyAndClose({
                    type: "wallpaper",
                    mediaType: wallpaper.mediaType,
                    value: wallpaper.mediaUrl,
                    title: wallpaper.title
                  })
                }
                type="button"
              >
                <span
                  className="wallpaper-preview"
                  style={{ backgroundImage: `url("${wallpaper.previewUrl}")` }}
                />
                <span className="wallpaper-copy">
                  <strong>{wallpaper.title}</strong>
                  <small>{wallpaper.mediaType === "video" ? "动态视频" : "动态预览 / 静态场景"}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="background-empty">
            未检测到 Wallpaper Engine 壁纸。请确认 Steam 和 Wallpaper Engine 已安装，并且至少订阅了一张壁纸。
          </p>
        )}
      </section>

      <section className="background-section" aria-labelledby="custom-background-heading">
        <div className="background-section-heading">
          <div>
            <p className="section-kicker">自定义文件</p>
            <h3 id="custom-background-heading">上传图片或视频</h3>
          </div>
        </div>
        <div className="background-upload-options">
          <label className="background-upload">
            <ImageIcon width="20" height="20" />
            <span>
              <strong>{uploading ? "正在保存..." : "选择单张图片或视频"}</strong>
              <small>作为当前游戏或首页的固定背景</small>
            </span>
            <input accept="image/*,video/*" disabled={uploading} onChange={(event) => void handleUpload(event.target.files?.[0])} type="file" />
          </label>
          <label className="background-upload">
            <ImageIcon width="20" height="20" />
            <span>
              <strong>{uploading ? "正在保存..." : "自动选择本地图集"}</strong>
              <small>选择文件夹，最多 40 张，自动无缝轮换</small>
            </span>
            <input accept="image/*" disabled={uploading} multiple onChange={(event) => void handleGalleryUpload(event.target.files)} ref={(input) => input?.setAttribute("webkitdirectory", "")} type="file" />
          </label>
        </div>
      </section>

      <section className="background-section" aria-labelledby="url-background-heading">
        <div className="background-section-heading">
          <div>
            <p className="section-kicker">网络图片</p>
            <h3 id="url-background-heading">使用图片或视频地址</h3>
          </div>
        </div>
        <form className="background-url-form" onSubmit={handleUrlSubmit}>
          <label className="field">
            <span>背景地址</span>
            <input
              onChange={(event) => {
                setUrl(event.target.value);
                setError(null);
              }}
              placeholder="https://example.com/background.mp4"
              value={url}
            />
          </label>
          <div className="background-url-actions">
            <div className="background-type-options">
              <button
                aria-pressed={urlMediaType === "image"}
                onClick={() => setUrlMediaType("image")}
                type="button"
              >
                <ImageIcon width="16" height="16" />
                图片
              </button>
              <button
                aria-pressed={urlMediaType === "video"}
                onClick={() => setUrlMediaType("video")}
                type="button"
              >
                <MonitorIcon width="16" height="16" />
                视频
              </button>
            </div>
            <button className="button button-primary" type="submit">
              应用地址
            </button>
          </div>
        </form>
      </section>

      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </Modal>
  );
}