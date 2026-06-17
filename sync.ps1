# sync-upstream.ps1
[CmdletBinding()]
param(
    [string]$Remote = 'upstream',
    [string]$Branch,
    [switch]$AllowDirty
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([Parameter(Mandatory)][string[]]$Args)
    & git @Args
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE"
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'git is not installed or not available in PATH.'
}

Invoke-Git @('rev-parse', '--is-inside-work-tree') | Out-Null

$repoRoot = (Invoke-Git @('rev-parse', '--show-toplevel')).Trim()
Set-Location $repoRoot

$currentBranch = (Invoke-Git @('branch', '--show-current')).Trim()
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    throw 'You are in a detached HEAD state. Checkout the branch you want to sync first.'
}

if ([string]::IsNullOrWhiteSpace($Branch)) {
    $Branch = $currentBranch
}

$status = (git status --porcelain)
if ($status -and -not $AllowDirty) {
    throw 'Working tree is not clean. Commit or stash changes first, or rerun with -AllowDirty.'
}

Invoke-Git @('remote', 'get-url', $Remote) | Out-Null

Write-Host "Fetching $Remote..." -ForegroundColor Cyan
Invoke-Git @('fetch', $Remote, '--prune')

$upstreamRef = "$Remote/$Branch"
Invoke-Git @('show-ref', '--verify', "--quiet", "refs/remotes/$upstreamRef")
if ($LASTEXITCODE -ne 0) {
    throw "Remote branch '$upstreamRef' does not exist. Check the branch name."
}

Write-Host "Merging $upstreamRef into $currentBranch..." -ForegroundColor Cyan
& git merge --no-ff --no-edit $upstreamRef
$mergeExit = $LASTEXITCODE

if ($mergeExit -eq 0) {
    Write-Host "Sync complete. $currentBranch is now up to date with $upstreamRef." -ForegroundColor Green
    exit 0
}

if ($mergeExit -eq 1) {
    Write-Host ''
    Write-Host 'Merge conflicts detected. Resolve them manually, then run:' -ForegroundColor Yellow
    Write-Host '  git add .' -ForegroundColor Yellow
    Write-Host '  git commit' -ForegroundColor Yellow
    exit 1
}

throw "git merge failed with exit code $mergeExit"
