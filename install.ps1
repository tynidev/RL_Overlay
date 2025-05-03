# This script installs the necessary components for the RL_Overlay project.
# It installs the BakkesMod SOS plugin, checks/installs Node.js, and sets up the WebSocket relay, overlay web app, and console applications.

$root = get-location

function install-sos-plugin {
    $bakkesDir = "$env:APPDATA/bakkesmod/bakkesmod";
    if(!(Test-Path -Path $bakkesDir)){
        write-warning "BakkesMod is not installed. Please install BakkesMod from https://bakkesplugins.com/ and then re-run this script."
        write-host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }

    # copy plugin and just overwrite if existing
    copy-item ./bakkes-plugins/SOS.dll -Destination "$bakkesDir/plugins"
    copy-item ./bakkes-plugins/sos.set -Destination "$bakkesDir/plugins/settings"

    # add load plugin to bakkes config if not already added
    if(!(get-content "$bakkesDir/cfg/plugins.cfg" | select-string "plugin load sos")) { 
        add-content -Path "$bakkesDir/cfg/plugins.cfg" -value "`nplugin load sos"
    } 
}

function install-node-js {
    $nodeExists = Get-Command "node" -errorAction SilentlyContinue;
    if (!$nodeExists){
        winget install OpenJS.NodeJS
        write-host "Restart PowerShell to update the PATH environment variable and ensure Node.js is recognized, then re-run this script."
        exit 0
    }
}

function Install-WsRelay {
    Set-Location $root/sos-ws-relay
    npm install
    Set-Location $root
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$root/SOS-WS-Relay.lnk")
    $Shortcut.TargetPath = "npm"
    $Shortcut.Arguments = "run relay"
    $Shortcut.WorkingDirectory = "$root/sos-ws-relay"
    $Shortcut.Save()
}

function install-overlay-app {
    Set-Location $root/overlay-app
    npm install
    npm run build
    npm install -g serve
    Set-Location $root

    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$root/Overlay-Server.lnk")
    $Shortcut.TargetPath = "serve"
    $Shortcut.Arguments = "-s build"
    $Shortcut.WorkingDirectory = "$root/overlay-app"
    $Shortcut.Save()
    
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$root/Mini-Map.lnk")
    $Shortcut.TargetPath = "http://localhost:3000/minimap"
    $Shortcut.Save()
    
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$root/Game-Stats.lnk")
    $Shortcut.TargetPath = "http://localhost:3000/stats"
    $Shortcut.Save()
    
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$root/Overlay.lnk")
    $Shortcut.TargetPath = "http://localhost:3000"
    $Shortcut.Save()
}

function install-series-app {
    Set-Location $root/console-apps
    npm install
    Set-Location $root

    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$root/Series.lnk")
    $Shortcut.TargetPath = "npm"
    $Shortcut.Arguments = "run series"
    $Shortcut.WorkingDirectory = "$root/console-apps"
    $Shortcut.Save()

    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$root/Test-Game.lnk")
    $Shortcut.TargetPath = "npm"
    $Shortcut.Arguments = "run replay"
    $Shortcut.WorkingDirectory = "$root/console-apps"
    $Shortcut.Save()
}

install-node-js
install-sos-plugin
Install-WsRelay
install-overlay-app
install-series-app
exit 0