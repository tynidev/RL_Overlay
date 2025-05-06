<#
.SYNOPSIS
    Automates Rocket League streaming setup process.

.DESCRIPTION
    This script prepares the environment for streaming Rocket League by:
    - Ensuring BakkesMod is running.
    - Configuring Rocket League display settings (resolution and window mode).
    - Launching Rocket League (from Epic Games or Steam, based on user choice).
    - Starting required background applications in Windows Terminal tabs:
      * SOS WebSocket Relay
      * Overlay Web Server
    - Waiting for the Overlay Web Server to become available.
    - Opening the Control Room URL (http://localhost:3000/ctrl) in the default browser.
    - Launching OBS Studio if it's not already running.

.NOTES
    Requires ./install.ps1 to be run first to install/build necessary applications.

    Requires following programs applications to be installed:
    - BakkesMod (for Rocket League modding)
    - Rocket League (Epic Games or Steam)
    - Node.js (for running the SOS WebSocket Relay and Overlay Server)
    - Windows Terminal (for managing multiple command line applications)
    - OBS Studio (for streaming)

    Requires default installation paths for BakkesMod, OBS Studio as well as default Rocket League configuration file location.
    - BakkesMod: C:\Program Files\BakkesMod\BakkesMod.exe
    - OBS Studio: C:\Program Files\obs-studio\bin\64bit\obs64.exe
    - Rocket League settings file: C:\Users\<YourUsername>\Documents\My Games\Rocket League\TAGame\Config\TASystemSettings.ini
#>

#----------------------------------------------------------------------------
# Configuration Variables - Edit these to match your setup
#----------------------------------------------------------------------------

# Application paths
$BAKKESMOD_PATH = "C:\Program Files\BakkesMod\BakkesMod.exe"
$OBS_WORKING_DIR = "C:\Program Files\obs-studio\bin\64bit"
$OBS_PATH = "$OBS_WORKING_DIR\obs64.exe"

# Rocket League Game settings and launch commands
$RL_CONFIG_PATH = [Environment]::GetFolderPath("MyDocuments") + "\My Games\Rocket League\TAGame\Config\TASystemSettings.ini"
$RL_EPIC_URL = "com.epicgames.launcher://apps/9773aa1aa54f4f7b80e44bef04986cea%3A530145df28a24424923f5828cc9031a1%3ASugar?action=launch&silent=true"
$RL_STEAM_URL = "steam://rungameid/252950"

# Rocket League Display settings
$RL_DISPLAY_WIDTH = 2560
$RL_DISPLAY_HEIGHT = 1440
$RL_WINDOW_MODE = "Borderless"  # Options: Fullscreen, Borderless, Windowed

# How long to wait for each application to start
# Adjust these delays based on your system performance, time is in seconds
$BAKKESMOD_STARTUP_DELAY = 10     # Delay for BakkesMod to fully load
$ROCKET_LEAGUE_STARTUP_DELAY = 25 # Delay for Rocket League to fully load
$OBS_STARTUP_DELAY = 10           # Delay after starting OBS
$BROWSER_OPEN_DELAY = 5           # Delay before opening the control room URL in the browser

#----------------------------------------------------------------------------
# Functions
#----------------------------------------------------------------------------

# Define function to modify Rocket League display settings
function Set-RocketLeagueDisplaySettings {
    param(
        [int]$Width = $RL_DISPLAY_WIDTH,
        [int]$Height = $RL_DISPLAY_HEIGHT,
        [string]$WindowMode = $RL_WINDOW_MODE
    )
    
    if (-not (Test-Path $RL_CONFIG_PATH)) {
        Write-Host "Warning: Rocket League settings file not found at $RL_CONFIG_PATH. Settings cannot be changed."
        return $false
    }
    
    try {
        Write-Host "Setting Rocket League display mode to $Width x $Height in $WindowMode mode..."
        
        # Update ResX and ResY in the INI file
        $content = Get-Content $RL_CONFIG_PATH
        $content = $content -replace 'ResX=\d+', "ResX=$Width"
        $content = $content -replace 'ResY=\d+', "ResY=$Height"
        
        # Set window mode
        switch ($WindowMode) {
            "Fullscreen" {
                $content = $content -replace 'Borderless=\w+', "Borderless=True"
                $content = $content -replace 'Fullscreen=\w+', "Fullscreen=True"
            }
            "Borderless" {
                $content = $content -replace 'Borderless=\w+', "Borderless=True"
                $content = $content -replace 'Fullscreen=\w+', "Fullscreen=False"
            }
            "Windowed" {
                $content = $content -replace 'Borderless=\w+', "Borderless=False"
                $content = $content -replace 'Fullscreen=\w+', "Fullscreen=False"
            }
        }
        
        # Save changes back to the file
        $content | Set-Content $RL_CONFIG_PATH
        
        Write-Host "Rocket League display settings updated successfully!"
        return $true
    }
    catch {
        Write-Host "Error updating Rocket League settings: $_"
        return $false
    }
}

# Function to convert a string to a Base64-encoded command for PowerShell
function Convert-ToBase64EncodedCommand {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Command
    )
    
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($Command)
    $encodedCommand = [Convert]::ToBase64String($bytes)
    return $encodedCommand
}

#----------------------------------------------------------------------------
# Main Script
#----------------------------------------------------------------------------

# Check if BakkesMod is running and start it if not
$bakkesModProcess = Get-Process -Name BakkesMod -ErrorAction SilentlyContinue
if (-not $bakkesModProcess) {
    Write-Host "BakkesMod is not running. Starting BakkesMod..."
    Start-Process $BAKKESMOD_PATH
    # Add a small delay to allow BakkesMod to initialize
    Start-Sleep -Seconds $BAKKESMOD_STARTUP_DELAY
} else {
    Write-Host "BakkesMod is already running."
}

# Check if Rocket League is running and start it if not
$rocketLeagueProcess = Get-Process -Name RocketLeague -ErrorAction SilentlyContinue
if (-not $rocketLeagueProcess) {
    Write-Host "Rocket League is not running."
    
    # Set Rocket League display settings before launching
    if(-not (Set-RocketLeagueDisplaySettings -Width $RL_DISPLAY_WIDTH -Height $RL_DISPLAY_HEIGHT -WindowMode $RL_WINDOW_MODE)) {
        Write-Host "Failed to set Rocket League display settings. Exiting script."
    }
    
    # Ask if the user wants to use the Epic Games or Steam version of Rocket League
    Write-Host "Launch Rocket League from:" -ForegroundColor Cyan
    Write-Host "  (1) Epic Games" -ForegroundColor Cyan
    Write-Host "  (2) Steam" -ForegroundColor Cyan
    Write-Host "Enter selection: " -ForegroundColor Cyan -NoNewline
    $launchOption = Read-Host
    if ($launchOption -eq "1") {
        Write-Host "Starting Rocket League from Epic Games..."
        Start-Process $RL_EPIC_URL
        Start-Sleep -Seconds $ROCKET_LEAGUE_STARTUP_DELAY
    } elseif ($launchOption -eq "2") {
        Write-Host "Starting Rocket League from Steam..."
        Start-Process $RL_STEAM_URL
        Start-Sleep -Seconds $ROCKET_LEAGUE_STARTUP_DELAY
    } else {
        Write-Host "Invalid option. Skipping Rocket League launch."
    }
} else {
    Write-Host "Rocket League is already running."
}

# Launch Windows Terminal with required tabs
$root = Get-Location # Get the current working directory to use as the base path for applications
Write-Host "Starting SOS Relay and Overlay Server in Windows Terminal..."
Start-Process wt -ArgumentList @(
    # Start the SOS WebSocket Relay in the first tab
    "-d", "`"$(Join-Path $root "sos-ws-relay")`"", "--title", "`"SOS WS Relay`"", "powershell", "-NoExit", "-Command", "`"npm run relay;`"",
    # Start the Overlay Server (serve) in the second tab
    "new-tab", "-d", "`"$(Join-Path $root "overlay-app")`"", "--title", "`"Overlay Web Server`"", "powershell", "-NoExit", "-Command", "`"serve -s build`""
)
Write-Host "Started background applications in Windows Terminal tabs."

# Wait for the Overlay Web Server to potentially start, checking every second
Write-Host "Waiting up to $BROWSER_OPEN_DELAY seconds for the Overlay Web Server..."
$serverStarted = $false
for ($i = 0; $i -lt $BROWSER_OPEN_DELAY; $i++) {
    $serverListening = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($serverListening) {
        Write-Host "Overlay Web Server detected listening on port 3000."
        $serverStarted = $true
        break # Exit the loop as soon as the server is found
    }
    Write-Host "Server not yet detected, waiting 1 second..."
    Start-Sleep -Seconds 1
}

# Open the browser if the server started
if ($serverStarted) {
    Write-Host "Opening Control Room URL in browser: http://localhost:3000/ctrl"
    # Note: Checking if this specific URL is already open in a tab is complex and unreliable.
    # We will open it; the browser will likely handle duplicates (new tab or focus existing).
    Start-Process "http://localhost:3000/ctrl"
} else {
    Write-Host "Warning: Overlay Web Server did not start listening on port 3000 within the $BROWSER_OPEN_DELAY second timeout."
    Write-Host "Skipping opening the Control Room URL in the browser."
}

# Check if OBS is running and start it if not
$obsProcess = Get-Process -Name obs64 -ErrorAction SilentlyContinue
if (-not $obsProcess) {
    Write-Host "OBS is not running. Starting OBS..."
    if (Test-Path $OBS_PATH) {
        Start-Process $OBS_PATH -WorkingDirectory $OBS_WORKING_DIR
        # Add a small delay to allow OBS to initialize
        Start-Sleep -Seconds $OBS_STARTUP_DELAY
    } else {
        Write-Host "OBS executable not found at $OBS_PATH. Please check the installation path."
    }
} else {
    Write-Host "OBS is already running."
}