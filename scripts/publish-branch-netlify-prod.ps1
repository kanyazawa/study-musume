param(
    [string[]]$Commits = @("HEAD"),
    [string]$TargetBranch = "main",
    [string]$DeployWorktreePath = ".deploy-main",
    [string]$DeployBranch = "publish-main",
    [string]$SiteId = "3c83ab25-766c-4523-a9e4-e335e4145a64",
    [string]$ProductionUrl = "https://graceful-kringle-87e687.netlify.app",
    [switch]$SkipPush,
    [switch]$SkipDeploy,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE"
    }
}

function Invoke-Git {
    param(
        [string]$Workdir,
        [string[]]$GitArgs
    )

    Push-Location $Workdir
    try {
        $output = & git @GitArgs
        Assert-LastExitCode ("git " + ($GitArgs -join " "))
        return @($output)
    }
    finally {
        Pop-Location
    }
}

function Invoke-Tool {
    param(
        [string]$Workdir,
        [string]$Command,
        [string[]]$ToolArgs
    )

    Push-Location $Workdir
    try {
        & $Command @ToolArgs
        Assert-LastExitCode ($Command + " " + ($ToolArgs -join " "))
    }
    finally {
        Pop-Location
    }
}

function Get-SingleLineGitOutput {
    param(
        [string]$Workdir,
        [string[]]$GitArgs
    )

    $lines = Invoke-Git -Workdir $Workdir -GitArgs $GitArgs
    return ($lines | Select-Object -First 1).Trim()
}

function Ensure-CleanWorktree {
    param([string]$Workdir)

    $statusLines = @(Invoke-Git -Workdir $Workdir -GitArgs @("status", "--porcelain"))
    if ($statusLines.Count -gt 0) {
        throw "Worktree is not clean: $Workdir"
    }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceBranch = Get-SingleLineGitOutput -Workdir $projectRoot -GitArgs @("branch", "--show-current")
$sourceStatus = @(Invoke-Git -Workdir $projectRoot -GitArgs @("status", "--porcelain"))

if ($sourceStatus.Count -gt 0) {
    Write-Warning "Source worktree has uncommitted changes. Only committed changes in -Commits will be published."
}

$resolvedCommits = foreach ($commitSpec in $Commits) {
    $sha = Get-SingleLineGitOutput -Workdir $projectRoot -GitArgs @("rev-parse", "--verify", "$commitSpec^{commit}")
    $subject = Get-SingleLineGitOutput -Workdir $projectRoot -GitArgs @("log", "-1", "--format=%s", $sha)
    [pscustomobject]@{
        Spec = $commitSpec
        Sha = $sha
        Subject = $subject
    }
}

$deployRoot = if ([System.IO.Path]::IsPathRooted($DeployWorktreePath)) {
    $DeployWorktreePath
}
else {
    Join-Path $projectRoot $DeployWorktreePath
}

Write-Host "Source branch: $sourceBranch"
Write-Host "Deploy worktree: $deployRoot"
Write-Host "Target branch: $TargetBranch"

foreach ($commit in $resolvedCommits) {
    Write-Host ("Publish commit: {0} {1}" -f $commit.Sha.Substring(0, 7), $commit.Subject)
}

if (-not (Test-Path $deployRoot)) {
    Write-Host "Deploy worktree does not exist yet."

    if ($DryRun) {
        if ($sourceBranch -eq $TargetBranch) {
            Write-Host "Dry run: would create deploy worktree from origin/$TargetBranch on branch $DeployBranch."
        }
        else {
            Write-Host "Dry run: would create deploy worktree from local branch $TargetBranch."
        }
    }
    else {
        Invoke-Git -Workdir $projectRoot -GitArgs @("fetch", "origin", $TargetBranch) | Out-Null

        if ($sourceBranch -eq $TargetBranch) {
            Invoke-Git -Workdir $projectRoot -GitArgs @("worktree", "add", "-B", $DeployBranch, $deployRoot, "origin/$TargetBranch") | Out-Null
        }
        else {
            Invoke-Git -Workdir $projectRoot -GitArgs @("worktree", "add", $deployRoot, $TargetBranch) | Out-Null
        }
    }
}

if ($DryRun) {
    Write-Host "Dry run: would fetch and fast-forward deploy worktree."
    foreach ($commit in $resolvedCommits) {
        Write-Host ("Dry run: would cherry-pick {0} into {1}." -f $commit.Sha.Substring(0, 7), $deployRoot)
    }

    if ($SkipPush) {
        Write-Host "Dry run: would skip push."
    }
    else {
        Write-Host "Dry run: would push HEAD:$TargetBranch to origin."
    }

    if ($SkipDeploy) {
        Write-Host "Dry run: would skip Netlify deploy."
    }
    else {
        Write-Host "Dry run: would deploy Netlify production from the deploy worktree."
    }

    return
}

Ensure-CleanWorktree -Workdir $deployRoot
Invoke-Git -Workdir $deployRoot -GitArgs @("fetch", "origin", $TargetBranch) | Out-Null
Invoke-Git -Workdir $deployRoot -GitArgs @("pull", "--ff-only", "origin", $TargetBranch) | Out-Null
Ensure-CleanWorktree -Workdir $deployRoot

foreach ($commit in $resolvedCommits) {
    $isAncestor = $true

    Push-Location $deployRoot
    try {
        & git merge-base --is-ancestor $commit.Sha HEAD
        $isAncestor = ($LASTEXITCODE -eq 0)
    }
    finally {
        Pop-Location
    }

    if ($isAncestor) {
        Write-Host ("Skipping {0}; already present in deploy worktree." -f $commit.Sha.Substring(0, 7))
        continue
    }

    Write-Host ("Cherry-picking {0}..." -f $commit.Sha.Substring(0, 7))

    try {
        Invoke-Git -Workdir $deployRoot -GitArgs @("cherry-pick", "-x", $commit.Sha) | Out-Null
    }
    catch {
        try {
            Invoke-Git -Workdir $deployRoot -GitArgs @("cherry-pick", "--abort") | Out-Null
        }
        catch {
        }

        throw "Cherry-pick failed for $($commit.Sha.Substring(0, 7)). Resolve the conflict in $deployRoot and rerun."
    }
}

if ($SkipPush) {
    Write-Host "Skipping push because -SkipPush was set."
}
else {
    Write-Host "Pushing deploy worktree HEAD to origin/main..."
    Invoke-Git -Workdir $deployRoot -GitArgs @("push", "origin", "HEAD:$TargetBranch") | Out-Null
}

if ($SkipDeploy) {
    Write-Host "Skipping Netlify deploy because -SkipDeploy was set."
    return
}

$deployHeadSha = Get-SingleLineGitOutput -Workdir $deployRoot -GitArgs @("rev-parse", "--short", "HEAD")
$deployMessage = "Deploy $TargetBranch @$deployHeadSha from $sourceBranch"

Write-Host "Deploying commit $deployHeadSha to Netlify production..."
Invoke-Tool -Workdir $deployRoot -Command "npx" -ToolArgs @(
    "netlify",
    "deploy",
    "--prod",
    "--site",
    $SiteId,
    "--functions",
    "netlify/functions",
    "--message",
    $deployMessage
)

Write-Host ""
Write-Host "Production deploy finished."
Write-Host "URL: $ProductionUrl"
