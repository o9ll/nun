$link = "https://github.com/o9ll/nun/releases/latest/download/NunInstallerCli.exe"

$outfile = "$env:TEMP\NunInstallerCli.exe"

Write-Output "Downloading installer to $outfile"

Invoke-WebRequest -Uri "$link" -OutFile "$outfile"

Write-Output ""

Start-Process -Wait -NoNewWindow -FilePath "$outfile"

# Cleanup
Remove-Item -Force "$outfile"
