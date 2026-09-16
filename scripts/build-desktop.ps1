param(
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path (Join-Path $projectRoot "release") "星迹手账.exe"
}
$distPath = Join-Path $projectRoot "dist"
$sourcePath = Join-Path $projectRoot "desktop-launcher\Program.cs"
$iconPath = Join-Path $projectRoot "public\app.ico"
$buildPath = Join-Path $projectRoot "desktop-launcher\build"
$tempExe = Join-Path $buildPath "星迹手账.exe"
$compiler = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$webViewSdk = Join-Path $projectRoot ".tools\webview2-sdk"
$webViewLibraryPath = @(
  (Join-Path $webViewSdk "lib\net45"),
  (Join-Path $webViewSdk "lib\net462")
) | Where-Object { Test-Path (Join-Path $_ "Microsoft.Web.WebView2.Core.dll") } | Select-Object -First 1
$webViewCore = Join-Path $webViewLibraryPath "Microsoft.Web.WebView2.Core.dll"
$webViewWinForms = Join-Path $webViewLibraryPath "Microsoft.Web.WebView2.WinForms.dll"
$webViewLoader = Join-Path $webViewSdk "runtimes\win-x64\native\WebView2Loader.dll"

if (-not (Test-Path $compiler)) {
  throw "找不到 .NET Framework 编译器：$compiler"
}
if (-not $webViewLibraryPath -or -not (Test-Path $webViewCore) -or -not (Test-Path $webViewWinForms) -or -not (Test-Path $webViewLoader)) {
  throw "找不到 WebView2 SDK，请安装 Microsoft Edge WebView2 SDK 或 Windows SDK。"
}

Push-Location $projectRoot
$previousBasePath = $env:VITE_BASE_PATH
$previousDisablePwa = $env:VITE_DISABLE_PWA
try {
  $env:VITE_BASE_PATH = "/gacha-daily-checkin-desktop/"
  $env:VITE_DISABLE_PWA = "true"
  pnpm build | Out-Host
} finally {
  $env:VITE_BASE_PATH = $previousBasePath
  $env:VITE_DISABLE_PWA = $previousDisablePwa
  Pop-Location
}

New-Item -ItemType Directory -Force -Path $buildPath | Out-Null

$resources = @(
  "/resource:$webViewCore,launcher.WebView2.Core.dll",
  "/resource:$webViewWinForms,launcher.WebView2.WinForms.dll",
  "/resource:$webViewLoader,launcher.WebView2Loader.dll"
)
Get-ChildItem -Path $distPath -Recurse -File | ForEach-Object {
  $relativePath = $_.FullName.Substring($distPath.Length + 1).Replace("\", "/")
  $resourceName = "site." + $relativePath.Replace("/", ".")
  $resources += "/resource:$($_.FullName),$resourceName"
}

$compilerArgs = @(
  "/nologo",
  "/target:winexe",
  "/platform:x64",
  "/optimize+",
  "/win32icon:$iconPath",
  "/out:$tempExe",
  "/reference:System.dll",
  "/reference:System.Core.dll",
  "/reference:System.Drawing.dll",
  "/reference:System.Windows.Forms.dll",
  "/reference:System.Web.Extensions.dll",
  "/reference:$webViewCore",
  "/reference:$webViewWinForms",
  $sourcePath
) + $resources

& $compiler @compilerArgs
if ($LASTEXITCODE -ne 0) {
  throw "桌面启动器编译失败，退出码：$LASTEXITCODE"
}

$tempFullPath = [System.IO.Path]::GetFullPath($tempExe)
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $outputFullPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
if (-not $tempFullPath.Equals($outputFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
  Copy-Item -LiteralPath $tempExe -Destination $outputFullPath -Force
}

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "星迹手账.lnk"
$installedIconPath = Join-Path $outputDirectory "app-icon-rabbit-v2.ico"
Copy-Item -LiteralPath $iconPath -Destination $installedIconPath -Force
$shell = New-Object -ComObject WScript.Shell
$temporaryShortcutPath = Join-Path $desktopPath "星迹手账-更新中.lnk"
$shortcut = $shell.CreateShortcut($temporaryShortcutPath)
$shortcut.TargetPath = $outputFullPath
$shortcut.WorkingDirectory = $outputDirectory
$shortcut.IconLocation = "$installedIconPath,0"
$shortcut.Description = "星迹手账"
$shortcut.Save()
if (Test-Path -LiteralPath $shortcutPath) {
  Remove-Item -LiteralPath $shortcutPath -Force
}
Move-Item -LiteralPath $temporaryShortcutPath -Destination $shortcutPath

Write-Host "桌面启动器已安装：$outputFullPath"
Write-Host "桌面快捷方式已生成：$shortcutPath"
