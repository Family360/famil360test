$ErrorActionPreference = 'Stop'
$batchFile = Join-Path $PSScriptRoot '..\batch_f_translations.txt'
$tsFile = Join-Path $PSScriptRoot '..\src\services\languageService.ts'
if (!(Test-Path $batchFile)) { throw "Batch file not found: $batchFile" }
if (!(Test-Path $tsFile)) { throw "languageService.ts not found: $tsFile" }
$batch = Get-Content -Raw $batchFile
$content = Get-Content -Raw $tsFile
$marker = "// Prune unwanted language codes"
$idx = $content.IndexOf($marker)
if ($idx -lt 0) { throw "Marker not found in languageService.ts" }
$new = $content.Substring(0,$idx) + "`n" + $batch + "`n" + $content.Substring($idx)
Set-Content -Path $tsFile -Value $new -Encoding UTF8
Write-Host "Batch F applied successfully." -ForegroundColor Green
