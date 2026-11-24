$ErrorActionPreference = 'Stop'
$client = Join-Path $PSScriptRoot 'client'
Set-Location $client
if (-not (Test-Path 'node_modules')) { Write-Host 'Installing frontend packages...' -ForegroundColor Yellow; npm install }
npm run dev -- --host 127.0.0.1
