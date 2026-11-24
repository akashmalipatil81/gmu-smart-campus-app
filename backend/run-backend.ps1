$ErrorActionPreference = 'Stop'
$backend = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $backend
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java is required. Install JDK 21 or newer.' }
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
  $version = '3.9.9'
  $tools = Join-Path $backend '.tools'
  $mavenHome = Join-Path $tools "apache-maven-$version"
  if (-not (Test-Path (Join-Path $mavenHome 'bin/mvn.cmd'))) {
    New-Item -ItemType Directory -Force -Path $tools | Out-Null
    $zip = Join-Path $tools 'maven.zip'
    Write-Host 'Maven was not found. Downloading Apache Maven 3.9.9...' -ForegroundColor Yellow
    Invoke-WebRequest "https://archive.apache.org/dist/maven/maven-3/$version/binaries/apache-maven-$version-bin.zip" -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath $tools -Force
    Remove-Item $zip -Force
  }
  $mvn = Join-Path $mavenHome 'bin/mvn.cmd'
} else { $mvn = 'mvn' }
Write-Host 'Starting GMU Smart Campus Java backend on http://localhost:4000' -ForegroundColor Green
& $mvn spring-boot:run
