Outfile "NunCustomInstaller.exe"
InstallDir "$APPDATA\NunCustomInstaller\dist"

Section

    ; Make sure target folders exist
    CreateDirectory "$APPDATA\NunCustomInstaller"
    CreateDirectory $INSTDIR

    ; Copy NunInstallerCli.exe first
    ; from dist\Installer\NunInstallerCli.exe
    SetOutPath "$APPDATA\NunCustomInstaller"
    File dist\Installer\NunInstallerCli.exe

    ; Copy Updater script
    File updater.ps1

    ; Copy VBScript launcher
    File LaunchUpdater.vbs

    ; Run the installer CLI with --install
    ExecWait '"$APPDATA\NunCustomInstaller\NunInstallerCli.exe" --install'

    ; Now overwrite dist with custom build
    SetOutPath $INSTDIR

    ; Copy only files in dist root
    File /nonfatal dist\*.*

    ; Register Updater at startup
    WriteRegStr HKCU \
        "Software\Microsoft\Windows\CurrentVersion\Run" \
        "NunUpdater" \
        '"wscript.exe" "$APPDATA\NunCustomInstaller\LaunchUpdater.vbs"'

    MessageBox MB_OK "Custom Nun build installed and injected into Discord!"

SectionEnd
