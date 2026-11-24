$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
docker compose up -d
$env:SPRING_PROFILES_ACTIVE = 'postgres'
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = 'postgres' }
if (-not $env:DB_PASSWORD) { $env:DB_PASSWORD = 'postgres' }
& (Join-Path $PSScriptRoot 'run-backend.ps1')
