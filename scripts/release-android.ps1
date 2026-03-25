$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectRoot "android"
$gradleUserHome = Join-Path $projectRoot ".gradle-user"
$keystoreProps = Join-Path $androidDir "keystore.properties"

Write-Host "Building web assets..."
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed with exit code $LASTEXITCODE"
}

Write-Host "Syncing Capacitor Android project..."
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    throw "npx cap sync android failed with exit code $LASTEXITCODE"
}

if (-not (Test-Path $keystoreProps)) {
    throw "android/keystore.properties がありません。android/keystore.properties.example をコピーして署名情報を設定してください。"
}

Write-Host "Building release bundle..."
$env:GRADLE_USER_HOME = $gradleUserHome
Push-Location $androidDir
try {
    .\gradlew.bat bundleRelease
    if ($LASTEXITCODE -ne 0) {
        throw "gradlew bundleRelease failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

Write-Host "Release bundle created at android/app/build/outputs/bundle/release/"
