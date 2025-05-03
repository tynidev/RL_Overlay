# Script to start the necessary applications in separate terminals

# Check if BakkesMod is running and start it if not
$bakkesModProcess = Get-Process -Name BakkesMod -ErrorAction SilentlyContinue
if (-not $bakkesModProcess) {
    Write-Host "BakkesMod is not running. Starting BakkesMod..."
    Start-Process "C:\Program Files\BakkesMod\BakkesMod.exe"
    # Optional: Add a small delay to allow BakkesMod to initialize
    Start-Sleep -Seconds 15
} else {
    Write-Host "BakkesMod is already running."
}

$root = Get-Location

# Start SOS WebSocket Relay
Set-Location "$root\sos-ws-relay";
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run relay"

# Start Overlay Server
Set-Location "$root\overlay-app";
Start-Process powershell -ArgumentList "-NoExit", "-Command", "serve -s build"

Start-Sleep -Seconds 10 # Wait for the overlay server to start

# Start Series App
Set-Location "$root\console-apps";
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run series"

set-Location $root

Write-Host "Started SOS Relay, Overlay Server, and Series App in separate terminals."
