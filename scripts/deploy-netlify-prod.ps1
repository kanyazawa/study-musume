param(
    [string]$SiteId = "3c83ab25-766c-4523-a9e4-e335e4145a64",
    [string]$ProductionUrl = "https://graceful-kringle-87e687.netlify.app",
    [switch]$AllowDirty,
    [switch]$SkipPush,
    [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE"
    }
}

$projectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $projectRoot
try {
    $currentBranch = (git branch --show-current).Trim()
    Assert-LastExitCode "git branch --show-current"

    if ($currentBranch -ne "main") {
        throw "This script only deploys from 'main'. Current branch: '$currentBranch'"
    }

    $statusLines = @(git status --porcelain)
    Assert-LastExitCode "git status --porcelain"

    if ($statusLines.Count -gt 0 -and -not $AllowDirty) {
        throw "Working tree is not clean. Commit or stash changes before deploying."
    }

    Write-Host "Current branch: $currentBranch"
    if ($statusLines.Count -gt 0) {
        Write-Host "Working tree is dirty, but continuing because -AllowDirty was set."
    }
    else {
        Write-Host "Working tree is clean."
    }

    if (-not $SkipPush) {
        Write-Host "Pushing main to origin..."
        git push origin main
        Assert-LastExitCode "git push origin main"
    }
    else {
        Write-Host "Skipping git push because -SkipPush was set."
    }

    if ($SkipDeploy) {
        Write-Host "Skipping Netlify deploy because -SkipDeploy was set."
        return
    }

    $headSha = (git rev-parse --short HEAD).Trim()
    Assert-LastExitCode "git rev-parse --short HEAD"

    Write-Host "Deploying commit $headSha to Netlify production..."
    npx netlify deploy --prod --site $SiteId --functions netlify/functions --message "Deploy main @$headSha"
    Assert-LastExitCode "npx netlify deploy --prod"

    Write-Host ""
    Write-Host "Production deploy finished."
    Write-Host "URL: $ProductionUrl"
}
finally {
    Pop-Location
}
