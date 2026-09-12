param(
  [string]$OutputPath = (Join-Path ([Environment]::GetFolderPath("Desktop")) "二游打卡.exe")
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $projectRoot "dist"
$sourcePath = Join-Path $projectRoot "desktop-launcher\Program.cs"
$iconPath = Join-Path $projectRoot "public\app.ico"
$buildPath = Join-Path $projectRoot "desktop-launcher\build"
$tempExe = Join-Path $buildPath "二游打卡.exe"
$compiler = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if (-not (Test-Path $compiler)) {
  throw "找不到 .NET Framework 编译器：$compiler"
}

Push-Location $projectRoot
try {
  pnpm build | Out-Host
} finally {
  Pop-Location
}

New-Item -ItemType Directory -Force -Path $buildPath | Out-Null

$resources = @()
Get-ChildItem -Path $distPath -Recurse -File | ForEach-Object {
  $relativePath = $_.FullName.Substring($distPath.Length + 1).Replace("\", "/")
  $resourceName = "site." + $relativePath.Replace("/", ".")
  $resources += "/resource:$($_.FullName),$resourceName"
}

$compilerArgs = @(
  "/nologo",
  "/target:winexe",
  "/platform:anycpu",
  "/optimize+",
  "/win32icon:$iconPath",
  "/out:$tempExe",
  "/reference:System.dll",
  "/reference:System.Core.dll",
  "/reference:System.Drawing.dll",
  "/reference:System.Windows.Forms.dll",
  $sourcePath
) + $resources

& $compiler @compilerArgs
if ($LASTEXITCODE -ne 0) {
  throw "桌面启动器编译失败，退出码：$LASTEXITCODE"
}

$tempFullPath = [System.IO.Path]::GetFullPath($tempExe)
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
if (-not $tempFullPath.Equals($outputFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
  Copy-Item -LiteralPath $tempExe -Destination $OutputPath -Force
}
Write-Host "桌面启动器已生成：$OutputPath"