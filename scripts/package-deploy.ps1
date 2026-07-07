# 工会门户部署包打包脚本
# Simple version to avoid encoding issues

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Union Portal - Deploy Packager" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$ProjectName = "union-portal"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$PackageName = "${ProjectName}-deploy-${Timestamp}.tar.gz"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "Project: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""

$TempDir = Join-Path $env:TEMP "union-portal-deploy-$Timestamp"
$PackageDir = Join-Path $TempDir $ProjectName
New-Item -ItemType Directory -Force -Path $PackageDir | Out-Null

Write-Host "[1/3] Copying files..." -ForegroundColor Green

$EssentialItems = @(
    "package.json", "package-lock.json", "next.config.mjs", "tsconfig.json",
    "tailwind.config.ts", "postcss.config.mjs", "prisma", "lib", "hooks",
    "components", "app", "scripts", "deploy", "nginx", "public",
    ".env.docker.example", "docker-compose.yml", "Dockerfile",
    ".dockerignore", "README.md"
)

Set-Location $ProjectRoot

foreach ($item in $EssentialItems) {
    $sourcePath = Join-Path $ProjectRoot $item
    if (Test-Path $sourcePath) {
        if (Test-Path $sourcePath -PathType Container) {
            Copy-Item -Path $sourcePath -Destination (Join-Path $PackageDir $item) -Recurse -Force
        } else {
            Copy-Item -Path $sourcePath -Destination $PackageDir -Force
        }
        Write-Host "  OK: $item" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[2/3] Creating archive..." -ForegroundColor Green

Set-Location $TempDir

try {
    tar -czf "$PackageName" $ProjectName
    Write-Host "  OK: $PackageName" -ForegroundColor Gray
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    exit 1
}

$FileItem = Get-Item (Join-Path $TempDir $PackageName)
$FileSizeMB = [math]::Round($FileItem.Length / 1MB, 2)

Write-Host ""
Write-Host "[3/3] Moving package..." -ForegroundColor Green

$FinalPath = Join-Path $ProjectRoot $PackageName
Move-Item -Path (Join-Path $TempDir $PackageName) -Destination $FinalPath -Force
Remove-Item -Path $TempDir -Recurse -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Package created successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "File: $FinalPath" -ForegroundColor Yellow
Write-Host "Size: ${FileSizeMB} MB" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Upload to server using WinSCP or SCP" -ForegroundColor White
Write-Host "  2. SSH to server: ssh root@your-server-ip" -ForegroundColor White
Write-Host "  3. Extract: tar -xzf $PackageName" -ForegroundColor White
Write-Host "  4. Deploy: sudo bash deploy/one-click-deploy.sh" -ForegroundColor White
Write-Host ""
