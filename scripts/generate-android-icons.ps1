$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $projectRoot "public\pwa-512x512.png"
$androidRes = Join-Path $projectRoot "android\app\src\main\res"
$densities = [ordered]@{
  "mipmap-mdpi" = 48
  "mipmap-hdpi" = 72
  "mipmap-xhdpi" = 96
  "mipmap-xxhdpi" = 144
  "mipmap-xxxhdpi" = 192
}
$image = [System.Drawing.Image]::FromFile($source)
try {
  foreach ($entry in $densities.GetEnumerator()) {
    $directory = Join-Path $androidRes $entry.Key
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    $bitmap = New-Object System.Drawing.Bitmap($entry.Value, $entry.Value)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.DrawImage($image, 0, 0, $entry.Value, $entry.Value)
    } finally { $graphics.Dispose() }
    $bitmap.Save((Join-Path $directory "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Save((Join-Path $directory "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
  }
} finally { $image.Dispose() }
Write-Host "Android icons updated."