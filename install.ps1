$root = get-location

function install-sos-plugin {
    $bakkesDir = "$env:APPDATA/bakkesmod/bakkesmod";
    if(!(Test-Path -Path $bakkesDir)){
        write-error "BakkesMod is not installed.  Install BakkesMod then re-run this script."
        exit 1
    }

    # copy plugin and just overwrite if exsiting
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
        write-host "Restart powershell for changes to take affect then re-run this script"
        exit 0
    }
}

function build-ws-relay {
    cd $root/sos-ws-relay
    npm install
    cd $root
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$root/SOS-WS-Relay.lnk")
    $Shortcut.TargetPath = "npm"
    $Shortcut.Arguments = "run relay"
    $Shortcut.WorkingDirectory = "$root/sos-ws-relay"
    $Shortcut.Save()
}

function build-overlay-app {
    cd $root/overlay-app
    npm install
    npm run build
    npm install -g serve
    cd $root

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

function build-series-app {
    cd $root/console-apps
    npm install
    cd $root

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
build-ws-relay
build-overlay-app
build-series-app
install-sos-plugin
exit 0