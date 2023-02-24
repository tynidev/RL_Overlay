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
}

function build-overlay-app {
    cd $root/overlay-app
    npm install
    npm run build
    cd $root
}

install-node-js
build-ws-relay
build-overlay-app
install-sos-plugin
exit 0