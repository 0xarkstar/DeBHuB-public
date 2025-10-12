# ============================================
# DeBHuB - Private to Public Sync Script
# ============================================
#
# 사용법:
#   .\sync-to-public.ps1
#   .\sync-to-public.ps1 -CommitMessage "feat: Add new feature"
#   .\sync-to-public.ps1 -DryRun  # 테스트만 (실제 복사 안함)
#
# ============================================

param(
    [string]$CommitMessage = "",
    [switch]$DryRun = $false
)

$PRIVATE_DIR = "C:\Users\user\irysbase"
$PUBLIC_DIR = "C:\Users\user\DeBHuB-public"

# 색상 출력 함수
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Cyan "============================================"
Write-ColorOutput Cyan "  DeBHuB Private → Public Sync"
Write-ColorOutput Cyan "============================================"
Write-Host ""

# Public 디렉토리 존재 확인
if (-not (Test-Path $PUBLIC_DIR)) {
    Write-ColorOutput Red "❌ Error: Public directory not found!"
    Write-ColorOutput Yellow "Expected: $PUBLIC_DIR"
    Write-Host ""
    Write-ColorOutput Yellow "💡 Tip: Run migration first:"
    Write-Host "  See MIGRATION_GUIDE.md for instructions"
    exit 1
}

# Private 레포가 깨끗한지 확인
Write-ColorOutput Yellow "🔍 Checking private repository status..."
Set-Location $PRIVATE_DIR

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-ColorOutput Red "⚠️  Warning: Private repository has uncommitted changes!"
    Write-Host ""
    Write-Host $gitStatus
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y") {
        Write-ColorOutput Yellow "Aborted."
        exit 1
    }
}

Write-ColorOutput Green "✅ Private repository is clean"
Write-Host ""

# Dry run 모드
if ($DryRun) {
    Write-ColorOutput Yellow "🧪 DRY RUN MODE - No files will be copied"
    Write-Host ""
}

# 동기화할 파일/폴더 목록
$itemsToSync = @(
    # Root files
    "README.md",
    "LICENSE",
    "SECURITY.md",
    "PUBLIC_RELEASE_GUIDE.md",
    "package.json",
    "pnpm-workspace.yaml",
    "turbo.json",
    ".gitignore",

    # Directories
    "apps\api",
    "apps\web-vite",
    "packages\shared",
    "packages\core",
    "packages\contracts",
    "packages\irys-integration",
    "packages\testing",
    "docs",
    "scripts"
)

# 제외할 패턴
$excludePatterns = @(
    "node_modules",
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".claude",
    "dist",
    "build",
    ".next",
    ".turbo",
    "*.log",
    ".DS_Store"
)

# 파일 복사
Write-ColorOutput Yellow "📦 Syncing files to public repository..."
Write-Host ""

$copiedCount = 0
$skippedCount = 0

foreach ($item in $itemsToSync) {
    $sourcePath = Join-Path $PRIVATE_DIR $item

    if (-not (Test-Path $sourcePath)) {
        Write-ColorOutput Gray "  ⊘ Skip (not found): $item"
        $skippedCount++
        continue
    }

    $targetPath = Join-Path $PUBLIC_DIR $item

    if ($DryRun) {
        Write-ColorOutput Cyan "  → Would copy: $item"
        $copiedCount++
        continue
    }

    try {
        if (Test-Path $sourcePath -PathType Container) {
            # 디렉토리 복사
            $params = @{
                Path = $sourcePath
                Destination = $targetPath
                Recurse = $true
                Force = $true
                Exclude = $excludePatterns
            }
            Copy-Item @params -ErrorAction Stop
        } else {
            # 파일 복사
            $targetDir = Split-Path $targetPath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item -Path $sourcePath -Destination $targetPath -Force -ErrorAction Stop
        }

        Write-ColorOutput Green "  ✓ Copied: $item"
        $copiedCount++
    }
    catch {
        Write-ColorOutput Red "  ✗ Failed: $item"
        Write-ColorOutput Red "    Error: $_"
        $skippedCount++
    }
}

Write-Host ""
Write-ColorOutput Cyan "📊 Summary:"
Write-Host "  Copied: $copiedCount items"
Write-Host "  Skipped: $skippedCount items"
Write-Host ""

if ($DryRun) {
    Write-ColorOutput Yellow "🧪 Dry run completed. No changes made."
    exit 0
}

# .env 파일 검사
Write-ColorOutput Yellow "🔍 Checking for sensitive files in public repository..."
Set-Location $PUBLIC_DIR

$sensitiveFiles = Get-ChildItem -Path . -Recurse -Include ".env",".env.local",".env.development",".env.production" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne ".env.example" }

if ($sensitiveFiles) {
    Write-ColorOutput Red "❌ ERROR: Sensitive files found in public repository!"
    Write-Host ""
    foreach ($file in $sensitiveFiles) {
        Write-ColorOutput Red "  ⚠️  $($file.FullName)"
    }
    Write-Host ""
    Write-ColorOutput Yellow "These files will be removed automatically."

    foreach ($file in $sensitiveFiles) {
        Remove-Item $file.FullName -Force
        Write-ColorOutput Yellow "  🗑️  Removed: $($file.Name)"
    }
    Write-Host ""
}

Write-ColorOutput Green "✅ No sensitive files found"
Write-Host ""

# Git status 확인
Write-ColorOutput Yellow "📝 Checking git status..."
$gitChanges = git status --porcelain

if (-not $gitChanges) {
    Write-ColorOutput Gray "No changes to commit. Already up to date!"
    exit 0
}

Write-Host ""
Write-Host "Changed files:"
git status --short
Write-Host ""

# 커밋 메시지 입력
if (-not $CommitMessage) {
    Write-ColorOutput Yellow "💬 Enter commit message (or press Enter for default):"
    $CommitMessage = Read-Host
}

if (-not $CommitMessage) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $CommitMessage = "chore: Sync from private repository ($timestamp)"
}

# Git 커밋
Write-ColorOutput Yellow "📤 Committing changes..."
git add .
git commit -m "$CommitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Commit failed!"
    exit 1
}

Write-ColorOutput Green "✅ Committed successfully"
Write-Host ""

# Push 여부 확인
$pushResponse = Read-Host "Push to remote? (y/n)"
if ($pushResponse -eq "y") {
    Write-ColorOutput Yellow "🚀 Pushing to origin/main..."
    git push origin main

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ Pushed successfully!"
    } else {
        Write-ColorOutput Red "❌ Push failed!"
        exit 1
    }
} else {
    Write-ColorOutput Yellow "⏸️  Skipped push. Run manually:"
    Write-Host "  cd $PUBLIC_DIR"
    Write-Host "  git push origin main"
}

Write-Host ""
Write-ColorOutput Cyan "============================================"
Write-ColorOutput Green "✅ Sync completed!"
Write-ColorOutput Cyan "============================================"
