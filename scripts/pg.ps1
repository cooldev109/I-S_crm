# Small helper to manage the local PostgreSQL instance set up under
# C:\Users\Administrator\pgsql. This installation is a binaries-only extract,
# NOT a Windows service — it has to be started manually after a reboot.
#
# Usage:
#   .\scripts\pg.ps1 start
#   .\scripts\pg.ps1 stop
#   .\scripts\pg.ps1 status
#   .\scripts\pg.ps1 psql

param(
  [Parameter(Position = 0)]
  [ValidateSet('start','stop','status','psql','restart')]
  [string]$Action = 'status'
)

$Bin = "C:\Users\Administrator\pgsql\pgsql\bin"
$DataDir = "C:\Users\Administrator\pgsql\data"
$LogFile = "C:\Users\Administrator\pgsql\postgres.log"

switch ($Action) {
  'start'   { & "$Bin\pg_ctl.exe" -D $DataDir -l $LogFile start }
  'stop'    { & "$Bin\pg_ctl.exe" -D $DataDir stop }
  'restart' { & "$Bin\pg_ctl.exe" -D $DataDir -l $LogFile -m fast restart }
  'status'  { & "$Bin\pg_ctl.exe" -D $DataDir status }
  'psql'    {
    $env:PGPASSWORD = 'postgres'
    & "$Bin\psql.exe" -h 127.0.0.1 -U postgres -d studio_ops
  }
}
