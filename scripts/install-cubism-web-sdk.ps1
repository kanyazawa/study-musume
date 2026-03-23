param(
    [string]$ZipPath = "public/live2d/sdk/CubismSdkForWeb-5-r.4.zip",
    [string]$OutputRoot = "public/live2d/sdk/cubism-5-r.4"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ZipPath)) {
    throw "Cubism SDK zip not found: $ZipPath"
}

$coreOutputDir = Join-Path $OutputRoot "Core"
New-Item -ItemType Directory -Force -Path $coreOutputDir | Out-Null

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $ZipPath))

try {
    $entriesToExtract = @(
        "CubismSdkForWeb-5-r.4/Core/live2dcubismcore.min.js",
        "CubismSdkForWeb-5-r.4/Core/RedistributableFiles.txt"
    )

    foreach ($entryPath in $entriesToExtract) {
        $entry = $zip.Entries | Where-Object { $_.FullName -eq $entryPath }
        if (-not $entry) {
            throw "Missing zip entry: $entryPath"
        }

        $destinationPath = Join-Path $coreOutputDir ([System.IO.Path]::GetFileName($entry.FullName))
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destinationPath, $true)
    }
}
finally {
    $zip.Dispose()
}

Write-Host "Installed Cubism Web core files to $OutputRoot"
