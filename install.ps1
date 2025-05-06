# This script installs the necessary components for the RL_Overlay project.
# It installs the BakkesMod SOS plugin, checks/installs Node.js, and sets up the WebSocket relay, overlay web app, and console applications.

$root = get-location

function Show-Header {
    param (
        [string]$title
    )
    
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host "    $title" -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Cyan
}

function install-sos-plugin {
    Show-Header "Installing BakkesMod SOS Plugin"
    
    $bakkesDir = "$env:APPDATA/bakkesmod/bakkesmod";
    Write-Host "Checking if BakkesMod is installed..." -ForegroundColor Yellow
    if(!(Test-Path -Path $bakkesDir)){
        Write-Host "BakkesMod is not installed." -ForegroundColor Red
        write-warning "BakkesMod is not installed. Please install BakkesMod from https://bakkesplugins.com/ and then re-run this script."
        write-host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Write-Host "BakkesMod installation found at: $bakkesDir" -ForegroundColor Green

    # copy plugin and just overwrite if existing
    Write-Host "Copying SOS plugin files to BakkesMod directory..." -ForegroundColor Yellow
    try {
        copy-item ./bakkes-plugins/SOS.dll -Destination "$bakkesDir/plugins" -Force
        Write-Host "SOS.dll copied successfully." -ForegroundColor Green
        
        copy-item ./bakkes-plugins/sos.set -Destination "$bakkesDir/plugins/settings" -Force
        Write-Host "sos.set settings file copied successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to copy plugin files: $_" -ForegroundColor Red
        Write-Host "Installation will continue, but the SOS plugin may not work correctly." -ForegroundColor Red
    }

    # add load plugin to bakkes config if not already added
    Write-Host "Checking BakkesMod plugins.cfg file..." -ForegroundColor Yellow
    try {
        $pluginsConfigPath = "$bakkesDir/cfg/plugins.cfg"
        
        if(!(get-content $pluginsConfigPath | select-string "plugin load sos")) { 
            Write-Host "Adding SOS plugin to BakkesMod autoload configuration..." -ForegroundColor Yellow
            add-content -Path $pluginsConfigPath -value "`nplugin load sos"
            Write-Host "SOS plugin added to autoload configuration." -ForegroundColor Green
        } else {
            Write-Host "SOS plugin already in autoload configuration." -ForegroundColor Green
        }
    } catch {
        Write-Host "Failed to update BakkesMod configuration: $_" -ForegroundColor Red
        Write-Host "You may need to manually add 'plugin load sos' to your BakkesMod config." -ForegroundColor Red
    }
    
    Write-Host "BakkesMod SOS plugin installation complete." -ForegroundColor Green
}

function install-node-js {
    Show-Header "Checking/Installing Node.js"
    
    Write-Host "Checking if Node.js is installed..." -ForegroundColor Yellow
    $nodeExists = Get-Command "node" -errorAction SilentlyContinue;
    
    if (!$nodeExists){
        Write-Host "Node.js not found. Installing Node.js using Winget..." -ForegroundColor Yellow
        try {
            winget install OpenJS.NodeJS
            Write-Host "Node.js installation initiated. You'll need to restart PowerShell after installation completes." -ForegroundColor Green
            Write-Host "Please restart PowerShell to update the PATH environment variable and ensure Node.js is recognized, then re-run this script." -ForegroundColor Yellow
            exit 0
        } catch {
            Write-Host "Failed to install Node.js: $_" -ForegroundColor Red
            Write-Host "Please install Node.js manually from https://nodejs.org/ and then re-run this script." -ForegroundColor Red
            exit 1
        }
    } else {
        $nodeVersion = & node --version
        Write-Host "Node.js is already installed (Version: $nodeVersion)." -ForegroundColor Green
    }
}

function Install-WsRelay {
    Show-Header "Installing WebSocket Relay Server"
    
    Write-Host "Navigating to $root/sos-ws-relay..." -ForegroundColor Yellow
    Set-Location $root/sos-ws-relay
    
    Write-Host "Installing NPM dependencies for WebSocket relay..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "Dependencies installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to install WebSocket relay dependencies: $_" -ForegroundColor Red
        Write-Host "Installation will continue, but the WebSocket relay may not work correctly." -ForegroundColor Red
    }
    
    Set-Location $root
    
    Write-Host "Creating shortcut for WebSocket relay server..." -ForegroundColor Yellow
    try {
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("$root/SOS-WS-Relay.lnk")
        $Shortcut.TargetPath = "npm"
        $Shortcut.Arguments = "run relay"
        $Shortcut.WorkingDirectory = "$root/sos-ws-relay"
        $Shortcut.Save()
        Write-Host "WebSocket relay shortcut created successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to create WebSocket relay shortcut: $_" -ForegroundColor Red
    }
    
    Write-Host "WebSocket relay installation complete." -ForegroundColor Green
}

function install-overlay-app {
    Show-Header "Installing Overlay Web Application"
    
    Write-Host "Navigating to $root/overlay-app..." -ForegroundColor Yellow
    Set-Location $root/overlay-app
    
    Write-Host "Installing NPM dependencies for overlay-app..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "Dependencies installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to install dependencies: $_" -ForegroundColor Red
        Write-Host "Installation will continue, but the overlay app may not work correctly." -ForegroundColor Red
    }
    
    Write-Host "Building the overlay application..." -ForegroundColor Yellow
    try {
        npm run build
        Write-Host "Build completed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to build overlay app: $_" -ForegroundColor Red
        Write-Host "Installation will continue, but the overlay may not work correctly." -ForegroundColor Red
    }
    
    Write-Host "Installing 'serve' globally for hosting the overlay..." -ForegroundColor Yellow
    try {
        npm install -g serve
        Write-Host "'serve' installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to install 'serve': $_" -ForegroundColor Red
        Write-Host "You may need to manually install it using 'npm install -g serve'." -ForegroundColor Red
    }
    
    Set-Location $root
    
    Write-Host "Creating shortcuts for overlay services..." -ForegroundColor Yellow
    try {
        $WshShell = New-Object -comObject WScript.Shell
        
        Write-Host "Creating Overlay-Server shortcut..." -ForegroundColor Yellow
        $Shortcut = $WshShell.CreateShortcut("$root/Overlay-Server.lnk")
        $Shortcut.TargetPath = "serve"
        $Shortcut.Arguments = "-s build"
        $Shortcut.WorkingDirectory = "$root/overlay-app"
        $Shortcut.Save()
        
        Write-Host "Creating Mini-Map shortcut..." -ForegroundColor Yellow
        $Shortcut = $WshShell.CreateShortcut("$root/Mini-Map.lnk")
        $Shortcut.TargetPath = "http://localhost:3000/minimap"
        $Shortcut.Save()
        
        Write-Host "Creating Game-Stats shortcut..." -ForegroundColor Yellow
        $Shortcut = $WshShell.CreateShortcut("$root/Game-Stats.lnk")
        $Shortcut.TargetPath = "http://localhost:3000/stats"
        $Shortcut.Save()
        
        Write-Host "Creating main Overlay shortcut..." -ForegroundColor Yellow
        $Shortcut = $WshShell.CreateShortcut("$root/Overlay.lnk")
        $Shortcut.TargetPath = "http://localhost:3000"
        $Shortcut.Save()
        
        Write-Host "All shortcuts created successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to create shortcuts: $_" -ForegroundColor Red
    }
    
    Write-Host "Overlay app installation complete." -ForegroundColor Green
}

function install-series-app {
    Show-Header "Installing Series Console Application"
    
    Write-Host "Navigating to $root/console-apps..." -ForegroundColor Yellow
    Set-Location $root/console-apps
    
    Write-Host "Installing NPM dependencies for console applications..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "Dependencies installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to install console apps dependencies: $_" -ForegroundColor Red
        Write-Host "Installation will continue, but the console applications may not work correctly." -ForegroundColor Red
    }
    
    Set-Location $root
    
    Write-Host "Creating shortcuts for console applications..." -ForegroundColor Yellow
    try {
        $WshShell = New-Object -comObject WScript.Shell
        
        Write-Host "Creating Series shortcut..." -ForegroundColor Yellow
        $Shortcut = $WshShell.CreateShortcut("$root/Series.lnk")
        $Shortcut.TargetPath = "npm"
        $Shortcut.Arguments = "run series"
        $Shortcut.WorkingDirectory = "$root/console-apps"
        $Shortcut.Save()
        Write-Host "Series shortcut created successfully." -ForegroundColor Green
        
        Write-Host "Creating Test-Game shortcut..." -ForegroundColor Yellow
        $Shortcut = $WshShell.CreateShortcut("$root/Test-Game.lnk")
        $Shortcut.TargetPath = "npm"
        $Shortcut.Arguments = "run replay"
        $Shortcut.WorkingDirectory = "$root/console-apps"
        $Shortcut.Save()
        Write-Host "Test-Game shortcut created successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to create console application shortcuts: $_" -ForegroundColor Red
    }
    
    Write-Host "Series console application installation complete." -ForegroundColor Green
}

function install-cea-lib {
    Show-Header "Installing PlayCEA API Library"
    
    Write-Host "Navigating to $root/PlayCEA-API..." -ForegroundColor Yellow
    Set-Location $root/PlayCEA-API
    
    Write-Host "Installing NPM dependencies for PlayCEA API..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "Dependencies installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to install PlayCEA API dependencies: $_" -ForegroundColor Red
        Write-Host "Installation will continue, but the PlayCEA API may not work correctly." -ForegroundColor Red
    }
    
    Write-Host "Building PlayCEA API library..." -ForegroundColor Yellow
    try {
        npm run build
        Write-Host "PlayCEA API built successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to build PlayCEA API: $_" -ForegroundColor Red
        Write-Host "Installation will continue, but functionality depending on the PlayCEA API may not work correctly." -ForegroundColor Red
    }
    
    Set-Location $root
    
    Write-Host "PlayCEA API library installation complete." -ForegroundColor Green
}

Write-Host "Starting RL Overlay Installation" -ForegroundColor Yellow
install-node-js
install-sos-plugin
Install-WsRelay
install-cea-lib
install-series-app
install-overlay-app
Write-Host "RL Overlay Installation Complete" -ForegroundColor Green
exit 0