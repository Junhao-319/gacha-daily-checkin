param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $PSScriptRoot "game-art-sources.json"
$outputPath = Join-Path $projectRoot "public\game-art"
$sources = Get-Content -LiteralPath $sourcePath -Raw | ConvertFrom-Json

New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

foreach ($property in $sources.PSObject.Properties) {
  $target = Join-Path $outputPath $property.Value.file
  if ((Test-Path -LiteralPath $target) -and -not $Force) {
    Write-Host "Skip $($property.Name)"
    continue
  }

  Write-Host "Download $($property.Name)"
  try {
    Invoke-WebRequest -Uri $property.Value.url -OutFile $target -TimeoutSec 60 -Headers @{
      "User-Agent" = "Mozilla/5.0"
      "Referer" = ([Uri]$property.Value.url).GetLeftPart([UriPartial]::Authority)
    }
  } catch {
    Write-Warning "Failed $($property.Name): $($_.Exception.Message)"
  }
}

Get-ChildItem -LiteralPath $outputPath -File | Select-Object Name,Length | Sort-Object Name | Format-Table -AutoSize