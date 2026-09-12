# 二游日常打卡

一个只保存在当前浏览器里的二游日常任务打卡 PWA，同时提供 Windows 单文件桌面启动器。

## 功能

- 内置主流二游目录，使用完整官方名称，并按游戏自动带入不同的日常任务模板。
- 桌面启动器会扫描 Windows 卸载信息、常用安装目录和游戏可执行文件，自动识别本机已安装的二游。
- 点击首页游戏卡片进入独立任务页，页面背景会切换为该游戏对应的官方主视觉。
- 每款游戏拥有独立任务清单，任务可以新增、改名和删除。
- 游戏内部的每项任务可以单独勾选；全部任务完成后，该游戏当天记为完整打卡。
- 最近 126 天热力图按“完整完成的游戏数量”展示，点击日期可查看具体任务进度。
- 支持跟随系统、浅色和深色主题。
- 数据保存在浏览器 `localStorage`，不需要账号或服务器。
- 可安装到桌面或手机主屏，并在离线时打开。

## 本地开发

需要 Node.js 24 和 pnpm 11。

```bash
pnpm install
pnpm dev
```

测试、构建与预览：

```bash
pnpm test:run
pnpm build
pnpm preview
```

## Windows 桌面启动器

运行以下命令会在桌面生成 `二游打卡.exe`：

```powershell
pnpm desktop
```

启动器会把网站资源全部打包进单个 `.exe`。双击后会自动启动本地服务并打开浏览器，同时常驻系统托盘；托盘菜单可以重新打开页面或退出。

桌面版会自动识别本机安装的游戏，但检测范围以 Windows 上存在的安装记录、目录和可执行文件为准，无法检测手机端的游戏。普通网页版本出于浏览器安全限制不能扫描本机，只能手动选择游戏。

如果需要重新抓取官方网站/官方商店主视觉：

```powershell
pnpm art
```

图片只在本地作为个人打卡背景使用，游戏名称、商标和主视觉版权归各自权利人所有。

## 发布到 GitHub Pages

1. 在 GitHub 创建一个公开仓库，仓库名必须是 `gacha-daily-checkin`。
2. 在当前项目目录设置远端并推送：

```bash
git remote add origin https://github.com/<你的用户名>/gacha-daily-checkin.git
git push -u origin master
```

3. 打开仓库的 `Settings` → `Pages`，把 `Build and deployment` 的 `Source` 设置为 `GitHub Actions`。
4. 等待 `Deploy to GitHub Pages` 工作流完成。
5. 访问 `https://<你的用户名>.github.io/gacha-daily-checkin/`。

之后每次推送到 `main` 或 `master`，工作流都会自动运行测试、重新构建并更新网站。

## 数据说明

打卡数据只存在当前浏览器，不会跨设备同步。桌面 EXE 和 GitHub Pages 是两个不同的网站来源，因此各自拥有一份独立数据。清除浏览器网站数据、使用无痕模式或更换浏览器都会得到一份独立的数据。