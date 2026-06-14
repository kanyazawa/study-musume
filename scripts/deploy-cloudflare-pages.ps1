param(
    [string]$ProjectName = "study-musume",
    [string]$Branch = "main",
    [switch]$SkipDeploy,
    [switch]$KeepWorkspace
)

$ErrorActionPreference = "Stop"

function Remove-PathIfExists {
    param([string]$PathToRemove)

    if (Test-Path $PathToRemove) {
        Remove-Item -Path $PathToRemove -Recurse -Force
    }
}

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE"
    }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$deployWorkspace = Join-Path $projectRoot ".deploy-head"
$archivePath = Join-Path $projectRoot ".deploy-head.zip"
$deployWranglerPath = Join-Path $deployWorkspace "wrangler.toml"
$deployPagesConfigPath = Join-Path $deployWorkspace "wrangler.jsonc"
$ttsGeneratedDir = Join-Path $deployWorkspace "public/audio/tts-generated"
$redirectsPath = Join-Path $deployWorkspace "public/_redirects"
$distRedirectsPath = Join-Path $deployWorkspace "dist/_redirects"
$distAssetsDir = Join-Path $deployWorkspace "dist/assets"

Write-Host "Preparing clean deploy workspace from HEAD..."
Remove-PathIfExists $deployWorkspace
Remove-PathIfExists $archivePath
Remove-PathIfExists (Join-Path $projectRoot ".deploy-head-zip")

Push-Location $projectRoot
try {
    git archive --format=zip HEAD -o $archivePath
    Assert-LastExitCode "git archive"

    Expand-Archive -Path $archivePath -DestinationPath $deployWorkspace -Force

    Write-Host "Removing assets that break Pages deploys..."
    Remove-PathIfExists $ttsGeneratedDir
    Remove-PathIfExists $redirectsPath

    Push-Location $deployWorkspace
    try {
        Write-Host "Building deploy bundle..."
        npm run build
        Assert-LastExitCode "npm run build"

        if (Test-Path $distAssetsDir) {
            Get-ChildItem -Path $distAssetsDir -Filter *.vrm -File | Remove-Item -Force
        }

        Remove-PathIfExists $distRedirectsPath

        if ($SkipDeploy) {
            Write-Host "Build completed. Skipping Cloudflare Pages deploy because -SkipDeploy was set."
        }
        else {
            Remove-PathIfExists $deployWranglerPath

            $pagesConfig = [ordered]@{
                '$schema' = "./node_modules/wrangler/config-schema.json"
                name = $ProjectName
                pages_build_output_dir = "./dist"
                compatibility_date = "2026-03-18"
                env = @{
                    production = @{}
                }
            }

            $pagesConfig | ConvertTo-Json -Depth 4 | Set-Content -Path $deployPagesConfigPath -Encoding ascii

            Write-Host "Deploying dist/ to Cloudflare Pages project '$ProjectName' on branch '$Branch'..."
            npx wrangler pages deploy dist --project-name $ProjectName --branch $Branch --commit-dirty=true
            Assert-LastExitCode "npx wrangler pages deploy"
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    Pop-Location

    if (-not $KeepWorkspace) {
        Remove-PathIfExists $deployWorkspace
        Remove-PathIfExists $archivePath
    }
}

Write-Host "Cloudflare Pages deploy flow completed."
