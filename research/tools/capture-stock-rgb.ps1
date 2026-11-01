# Run manually in an Administrator PowerShell. Never elevates itself.
# USB address 3 on USBPcap2 was descriptor-verified as 314B:1026.
# This is passive USB capture; it sends no HID settings or commands.
[CmdletBinding()]
param(
    [ValidateRange(15, 120)][int]$Seconds = 60,
    [ValidateRange(1, 127)][int]$DeviceAddress = 3
)
$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Open an Administrator PowerShell and run this script there. No capture started.'
}
if (Get-Process USBPcapCMD -ErrorAction SilentlyContinue) {
    throw 'An existing USBPcap capture is running. Stop it before starting this bounded capture.'
}
$captureExe = Join-Path $env:ProgramFiles 'USBPcap/USBPcapCMD.exe'
if (-not (Test-Path -LiteralPath $captureExe)) { throw 'USBPcapCMD is not installed.' }
$privateDir = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../outputs/private-captures'))
New-Item -ItemType Directory -Path $privateDir -Force | Out-Null
$output = Join-Path $privateDir ('stock-bright-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0,8) + '.pcap')
$worker = $null
try {
    # Already elevated: worker inherits this token, allowing finally to stop it.
    $worker = Start-Process -FilePath $captureExe -ArgumentList @('-d', '\\.\USBPcap2', '--devices', "$DeviceAddress", '--inject-descriptors', '-o', ('"' + $output + '"')) -WindowStyle Hidden -PassThru
    Start-Sleep -Seconds 2
    $worker.Refresh()
    if ($worker.HasExited) { throw ('Capture exited early: ' + $worker.ExitCode) }
    Write-Host 'RECORDING: open MKeyboard; set Static WHITE; change brightness to 50%, then 100%.'
    Write-Host 'Leave other settings alone. Avoid typing sensitive information during capture.'
    Write-Host ('Stops automatically in ' + $Seconds + ' seconds. Keep this window open.')
    for ($remaining = $Seconds; $remaining -gt 0; $remaining--) {
        Start-Sleep -Seconds 1
        $worker.Refresh()
        if ($worker.HasExited) { throw 'Capture worker exited before the timer finished.' }
    }
} finally {
    if ($null -ne $worker) {
        $worker.Refresh()
        if (-not $worker.HasExited) {
            Stop-Process -Id $worker.Id -ErrorAction Stop
            $worker.WaitForExit()
        }
    }
}
Write-Host ('STOPPED. Private capture: ' + $output)
Write-Host 'Close MKeyboard, leaving the keyboard bright. Tell Codex the capture finished.'
