<#
.SYNOPSIS
    Installs and sets up the Rocket League Overlay broadcasting environment.

.DESCRIPTION
    This script installs and configures all necessary components for the RL_Overlay project by:
    - Installing and configuring the BakkesMod SOS plugin for game data capture
    - Optionally installing the ButtonMash plugin for auto-spectating
    - Checking for and installing Node.js if not already present
    - Setting up the WebSocket relay server for transmitting game data
    - Building the PlayCEA API library for tournament integration
    - Installing and configuring the series console application
    - Building and setting up the overlay web application
    - Creating desktop shortcuts for all key components

.PARAMETER ButtonMash
    When specified, installs the ButtonMash BakkesMod plugin that automatically joins matches as spectator.
    
.EXAMPLE
    .\install.ps1
    
    Performs standard installation with only the required SOS plugin.

.EXAMPLE
    .\install.ps1 -ButtonMash
    
    Performs installation including the optional ButtonMash plugin for automatic spectating.

.NOTES
    Prerequisites:
    - BakkesMod should be installed before running this script
    - Internet connection required for package downloads
    - Administrative privileges may be needed for certain operations
    
    After installation, run start-stream.ps1 to launch the streaming environment.
    
    Default installation paths used:
    - BakkesMod plugins: %appdata%\bakkesmod\bakkesmod\plugins
    - BakkesMod settings: %appdata%\bakkesmod\bakkesmod\plugins\settings
    - BakkesMod config: %appdata%\bakkesmod\bakkesmod\cfg\plugins.cfg

.LINK
    GitHub Repository: https://github.com/tynidev/RL_Overlay
    Documentation: https://github.com/tynidev/RL_Overlay/blob/main/README.md
#>

param(
    [switch]$ButtonMash = $false
)

# Global variables
$script:root = Get-Location
$script:colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

#region Installation Functions

function Install-NodeJs {
    <#
    .SYNOPSIS
        Checks for and installs Node.js if not already present.
    #>
    Show-Header "Checking/Installing Node.js"
    
    Write-StepInfo -Message "Checking if Node.js is installed..." -Type "Info"
    $nodeExists = Test-CommandExists "node"
    
    if (!$nodeExists) {
        Write-StepInfo -Message "Node.js not found. Installing Node.js using Winget..." -Type "Info"
        try {
            winget install OpenJS.NodeJS
            Write-StepInfo -Message "Node.js installation initiated. You'll need to restart PowerShell after installation completes." -Type "Success"
            Write-StepInfo -Message "Please restart PowerShell to update the PATH environment variable and ensure Node.js is recognized, then re-run this script." -Type "Warning"
            exit 0
        } catch {
            Write-StepInfo -Message "Failed to install Node.js: $_" -Type "Error"
            Write-StepInfo -Message "Please install Node.js manually from https://nodejs.org/ and then re-run this script." -Type "Warning"
            exit 1
        }
    } else {
        $nodeVersion = & node --version
        Write-StepInfo -Message "Node.js is already installed (Version: $nodeVersion)." -Type "Success"
    }
}

function Install-BakkesModPlugins {
    <#
    .SYNOPSIS
        Installs BakkesMod plugins for Rocket League.
    .PARAMETER InstallButtonMash
        Whether to install the ButtonMash plugin.
    #>
    param(
        [bool]$InstallButtonMash = $false
    )
    
    if ($InstallButtonMash) {
        Show-Header "Installing BakkesMod Plugins (SOS & ButtonMash)"
    } else {
        Show-Header "Installing BakkesMod SOS Plugin"
    }
    
    $bakkesDir = "$env:APPDATA/bakkesmod/bakkesmod"
    $pluginsDir = "$bakkesDir/plugins"
    $settingsDir = "$bakkesDir/plugins/settings"
    $pluginsConfigPath = "$bakkesDir/cfg/plugins.cfg"
    
    Write-StepInfo -Message "Checking if BakkesMod is installed..." -Type "Info"
    if (!(Test-Path -Path $bakkesDir)) {
        Write-StepInfo -Message "BakkesMod is not installed." -Type "Error"
        Write-Warning "BakkesMod is not installed. Please install BakkesMod from https://bakkesplugins.com/ and then re-run this script."
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Write-StepInfo -Message "BakkesMod installation found at: $bakkesDir" -Type "Success"

    # Install plugins
    $plugins = @(
        @{
            Name = "SOS"
            DllPath = "./bakkes-plugins/SOS.dll"
            SettingsPath = "./bakkes-plugins/sos.set"
            ConfigEntry = "plugin load sos"
            Required = $true
        },
        @{
            Name = "ButtonMash"
            DllPath = "./bakkes-plugins/ButtonMash.dll"
            ConfigEntry = "plugin load buttonmash"
            Required = $false
        }
    )
    
    foreach ($plugin in $plugins) {
        # Skip ButtonMash if not requested
        if (!$plugin.Required -and !$InstallButtonMash) {
            continue
        }
        
        # Install plugin DLL
        Write-StepInfo -Message "Installing $($plugin.Name) plugin..." -Type "Info"
        try {
            Copy-Item $plugin.DllPath -Destination $pluginsDir -Force
            Write-StepInfo -Message "$($plugin.Name).dll copied successfully." -Type "Success"
            
            # Copy settings file if it exists
            if ($plugin.SettingsPath) {
                Copy-Item $plugin.SettingsPath -Destination $settingsDir -Force
                Write-StepInfo -Message "$(Split-Path $plugin.SettingsPath -Leaf) settings file copied successfully." -Type "Success"
            }
            
            # Add plugin to autoload config
            try {
                if (!(Get-Content $pluginsConfigPath | Select-String $plugin.ConfigEntry)) {
                    Write-StepInfo -Message "Adding $($plugin.Name) plugin to BakkesMod autoload configuration..." -Type "Info"
                    Add-Content -Path $pluginsConfigPath -Value "`n$($plugin.ConfigEntry)"
                    Write-StepInfo -Message "$($plugin.Name) plugin added to autoload configuration." -Type "Success"
                } else {
                    Write-StepInfo -Message "$($plugin.Name) plugin already in autoload configuration." -Type "Success"
                }
            } catch {
                Write-StepInfo -Message "Failed to update BakkesMod configuration for $($plugin.Name): $_" -Type "Error"
                Write-StepInfo -Message "You may need to manually add '$($plugin.ConfigEntry)' to your BakkesMod config." -Type "Warning"
            }
        } catch {
            Write-StepInfo -Message "Failed to copy $($plugin.Name) plugin files: $_" -Type "Error"
            Write-StepInfo -Message "Installation will continue, but the $($plugin.Name) plugin may not work correctly." -Type "Warning"
        }
    }
    
    if ($InstallButtonMash) {
        Write-StepInfo -Message "BakkesMod plugins (SOS & ButtonMash) installation complete." -Type "Success"
    } else {
        Write-StepInfo -Message "BakkesMod SOS plugin installation complete." -Type "Success"
    }
}

function Install-WebSocketRelay {
    <#
    .SYNOPSIS
        Sets up the WebSocket relay server for transmitting game data.
    #>
    Show-Header "Installing WebSocket Relay Server"
    
    Install-NpmDependencies -ProjectPath "$root/sos-ws-relay" -ProjectName "WebSocket relay"
    
    Create-Shortcut -ShortcutPath "$root/SOS-WS-Relay.lnk" -TargetPath "npm" `
                   -Arguments "run relay" -WorkingDirectory "$root/sos-ws-relay" `
                   -Description "Starts the SOS WebSocket Relay Server"
    
    Write-StepInfo -Message "WebSocket relay installation complete." -Type "Success"
}

function Install-CeaLibrary {
    <#
    .SYNOPSIS
        Builds the PlayCEA API library for tournament integration.
    #>
    Show-Header "Installing PlayCEA API Library"
    
    Install-NpmDependencies -ProjectPath "$root/PlayCEA-API" -ProjectName "PlayCEA API" -BuildCommand "build"
    
    Write-StepInfo -Message "PlayCEA API library installation complete." -Type "Success"
}

function Install-SeriesApp {
    <#
    .SYNOPSIS
        Installs and configures the series console application.
    #>
    Show-Header "Installing Series Console Application"
    
    Install-NpmDependencies -ProjectPath "$root/console-apps" -ProjectName "console applications"
    
    # Create shortcuts for console applications
    $consoleShortcuts = @(
        @{
            Path = "$root/Series.lnk"
            Target = "npm"
            Args = "run series"
            WorkDir = "$root/console-apps"
            Desc = "Runs the Series management console"
        },
        @{
            Path = "$root/Test-Game.lnk"
            Target = "npm"
            Args = "run replay"
            WorkDir = "$root/console-apps"
            Desc = "Runs the Test Game replay tool"
        }
    )
    
    $shortcutsCreated = $true
    foreach ($shortcut in $consoleShortcuts) {
        $result = Create-Shortcut -ShortcutPath $shortcut.Path -TargetPath $shortcut.Target `
                                 -Arguments $shortcut.Args -WorkingDirectory $shortcut.WorkDir `
                                 -Description $shortcut.Desc
        if (!$result) {
            $shortcutsCreated = $false
        }
    }
    
    Write-StepInfo -Message "Series console application installation complete." -Type "Success"
}

function Install-OverlayApp {
    <#
    .SYNOPSIS
        Builds and sets up the overlay web application.
    #>
    Show-Header "Installing Overlay Web Application"
    
    Install-NpmDependencies -ProjectPath "$root/overlay-app" -ProjectName "overlay application" -BuildCommand "build"
    
    Write-StepInfo -Message "Installing 'serve' globally for hosting the overlay..." -Type "Info"
    try {
        npm install -g serve
        Write-StepInfo -Message "'serve' installed successfully." -Type "Success"
    } catch {
        Write-StepInfo -Message "Failed to install 'serve': $_" -Type "Error"
        Write-StepInfo -Message "You may need to manually install it using 'npm install -g serve'." -Type "Warning"
    }
    
    # Create shortcuts for overlay services
    $overlayShortcuts = @(
        @{
            Path = "$root/Overlay-Server.lnk"
            Target = "serve"
            Args = "-s build"
            WorkDir = "$root/overlay-app"
            Desc = "Starts the Overlay web server"
        },
        @{
            Path = "$root/Mini-Map.lnk"
            Target = "http://localhost:3000/minimap"
            Desc = "Opens the Mini-Map overlay in default browser"
        },
        @{
            Path = "$root/Game-Stats.lnk"
            Target = "http://localhost:3000/stats"
            Desc = "Opens the Game Stats overlay in default browser"
        },
        @{
            Path = "$root/Overlay.lnk"
            Target = "http://localhost:3000"
            Desc = "Opens the main Overlay in default browser"
        }
    )
    
    $shortcutsCreated = $true
    foreach ($shortcut in $overlayShortcuts) {
        $result = Create-Shortcut -ShortcutPath $shortcut.Path -TargetPath $shortcut.Target `
                                 -Arguments $shortcut.Args -WorkingDirectory $shortcut.WorkDir `
                                 -Description $shortcut.Desc
        if (!$result) {
            $shortcutsCreated = $false
        }
    }
    
    if ($shortcutsCreated) {
        Write-StepInfo -Message "All overlay shortcuts created successfully." -Type "Success"
    }
    
    Write-StepInfo -Message "Overlay app installation complete." -Type "Success"
}

function Show-InstallationSummary {
    <#
    .SYNOPSIS
        Displays a summary of the installation process.
    .PARAMETER ButtonMashInstalled
        Whether the ButtonMash plugin was installed.
    #>
    param (
        [bool]$ButtonMashInstalled = $false
    )
    
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor $colors.Success
    Write-Host "    RL Overlay Installation Complete" -ForegroundColor $colors.Success
    Write-Host "====================================================" -ForegroundColor $colors.Success

    if ($ButtonMashInstalled) {
        Write-StepInfo -Message "- Installed SOS plugin for BakkesMod" -Type "Success"
        Write-StepInfo -Message "- Installed ButtonMash plugin for BakkesMod" -Type "Success"
    } else {
        Write-StepInfo -Message "- Installed SOS plugin for BakkesMod" -Type "Success"
        Write-StepInfo -Message "- ButtonMash plugin NOT installed (use -ButtonMash switch to install)" -Type "Warning"
    }

    Write-StepInfo -Message "- Set up WebSocket relay" -Type "Success"
    Write-StepInfo -Message "- Built PlayCEA API library" -Type "Success"
    Write-StepInfo -Message "- Set up Series console application" -Type "Success"
    Write-StepInfo -Message "- Built and set up Overlay web application" -Type "Success"
    Write-Host ""
    Write-Host "To use the overlay with ButtonMash in the future, run:" -ForegroundColor $colors.Info
    Write-Host "    .\install.ps1 -ButtonMash" -ForegroundColor $colors.Info
    Write-Host ""
}

#endregion Installation Functions

#region Helper Functions

function Show-Header {
    <#
    .SYNOPSIS
        Displays a standardized header for installation steps.
    .PARAMETER Title
        The title text to display in the header.
    #>
    param (
        [Parameter(Mandatory = $true)]
        [string]$Title
    )
    
    Write-Host ""
    Write-Host "====================================================" -ForegroundColor $colors.Info
    Write-Host "    $Title" -ForegroundColor $colors.Info
    Write-Host "====================================================" -ForegroundColor $colors.Info
}

function Write-StepInfo {
    <#
    .SYNOPSIS
        Writes formatted step information with consistent color coding.
    .PARAMETER Message
        The message to display.
    .PARAMETER Type
        The type of message (Info, Success, Warning, Error).
    #>
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $true)]
        [ValidateSet("Info", "Success", "Warning", "Error")]
        [string]$Type
    )
    
    Write-Host $Message -ForegroundColor $colors[$Type]
}

function Install-NpmDependencies {
    <#
    .SYNOPSIS
        Installs NPM dependencies for a project.
    .PARAMETER ProjectPath
        The path to the project.
    .PARAMETER ProjectName
        The name of the project for logging purposes.
    .PARAMETER BuildCommand
        An optional build command to run after installing dependencies.
    #>
    param (
        [Parameter(Mandatory = $true)]
        [string]$ProjectPath,
        
        [Parameter(Mandatory = $true)]
        [string]$ProjectName,
        
        [Parameter(Mandatory = $false)]
        [string]$BuildCommand
    )
    
    Write-StepInfo -Message "Navigating to $ProjectPath..." -Type "Info"
    Push-Location $ProjectPath
    
    Write-StepInfo -Message "Installing NPM dependencies for $ProjectName..." -Type "Info"
    try {
        npm install
        Write-StepInfo -Message "Dependencies installed successfully." -Type "Success"
        
        if ($BuildCommand) {
            Write-StepInfo -Message "Building the $ProjectName..." -Type "Info"
            try {
                npm run $BuildCommand
                Write-StepInfo -Message "Build completed successfully." -Type "Success"
            } catch {
                Write-StepInfo -Message "Failed to build $ProjectName : $_" -Type "Error"
                Write-StepInfo -Message "Installation will continue, but $ProjectName may not work correctly." -Type "Warning"
            }
        }
    } catch {
        Write-StepInfo -Message "Failed to install $ProjectName dependencies: $_" -Type "Error"
        Write-StepInfo -Message "Installation will continue, but $ProjectName may not work correctly." -Type "Warning"
    }
    
    Pop-Location
}

function Create-Shortcut {
    <#
    .SYNOPSIS
        Creates a Windows shortcut (.lnk) file.
    .PARAMETER ShortcutPath
        The path where the shortcut will be created.
    .PARAMETER TargetPath
        The target path for the shortcut.
    .PARAMETER Arguments
        Optional command line arguments.
    .PARAMETER WorkingDirectory
        Optional working directory.
    .PARAMETER Description
        Optional description of the shortcut.
    #>
    param (
        [Parameter(Mandatory = $true)]
        [string]$ShortcutPath,
        
        [Parameter(Mandatory = $true)]
        [string]$TargetPath,
        
        [Parameter(Mandatory = $false)]
        [string]$Arguments = "",
        
        [Parameter(Mandatory = $false)]
        [string]$WorkingDirectory = "",
        
        [Parameter(Mandatory = $false)]
        [string]$Description = ""
    )
    
    $shortcutName = Split-Path -Path $ShortcutPath -Leaf
    Write-StepInfo -Message "Creating '$shortcutName' shortcut..." -Type "Info"
    
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = $TargetPath
        
        if ($Arguments) {
            $Shortcut.Arguments = $Arguments
        }
        
        if ($WorkingDirectory) {
            $Shortcut.WorkingDirectory = $WorkingDirectory
        }
        
        if ($Description) {
            $Shortcut.Description = $Description
        }
        
        $Shortcut.Save()
        Write-StepInfo -Message "'$shortcutName' shortcut created successfully." -Type "Success"
        return $true
    } catch {
        Write-StepInfo -Message "Failed to create '$shortcutName' shortcut: $_" -Type "Error"
        return $false
    }
}

function Test-CommandExists {
    <#
    .SYNOPSIS
        Tests if a command exists in the current environment.
    .PARAMETER Command
        The command to test.
    #>
    param (
        [Parameter(Mandatory = $true)]
        [string]$Command
    )
    
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

#endregion Helper Functions

#region Main Script Execution Logic

# Welcome message
Write-Host ""
Write-Host "====================================================" -ForegroundColor $colors.Info
Write-Host "    Rocket League Overlay Installation" -ForegroundColor $colors.Info
Write-Host "====================================================" -ForegroundColor $colors.Info
Write-Host ""
Write-Host "This script will install and configure the following components:"
Write-Host "1. BakkesMod SOS plugin for game data capture" -ForegroundColor $colors.Info
if ($ButtonMash) {
    Write-Host "2. ButtonMash plugin for auto-spectating" -ForegroundColor $colors.Info
}
Write-Host "3. Node.js (if not already installed)" -ForegroundColor $colors.Info
Write-Host "4. WebSocket relay server" -ForegroundColor $colors.Info
Write-Host "5. PlayCEA API library" -ForegroundColor $colors.Info
Write-Host "6. Series console application" -ForegroundColor $colors.Info
Write-Host "7. Overlay web application" -ForegroundColor $colors.Info
Write-Host ""
Write-StepInfo -Message "Starting RL Overlay Installation" -Type "Info"

# Step 1: Check for Node.js
Install-NodeJs

# Step 2: Install BakkesMod plugins
Install-BakkesModPlugins -InstallButtonMash $ButtonMash

# Step 3: Set up WebSocket relay
Install-WebSocketRelay

# Step 4: Install PlayCEA API
Install-CeaLibrary

# Step 5: Set up Series console application
Install-SeriesApp

# Step 6: Set up Overlay web application
Install-OverlayApp

# Display installation summary
Show-InstallationSummary -ButtonMashInstalled $ButtonMash

#endregion Main Script Execution Logic

exit 0