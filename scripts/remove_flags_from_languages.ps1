$ErrorActionPreference = 'Stop'
$tsFile = Join-Path $PSScriptRoot '..\src\services\languageService.ts'
if (!(Test-Path $tsFile)) { throw "languageService.ts not found: $tsFile" }
$content = Get-Content -Raw $tsFile
# Remove occurrences of ", flag: '...'
$content = [regex]::Replace($content, ",\s*flag:\s*'[^']*'", "", 'Singleline')
# Also handle cases where flag appears first in object (rare). Remove "flag: '...',\s*"
$content = [regex]::Replace($content, "flag:\s*'[^']*',\s*", "", 'Singleline')
Set-Content -Path $tsFile -Value $content -Encoding UTF8
Write-Host "Removed flag properties from SUPPORTED_LANGUAGES." -ForegroundColor Green
