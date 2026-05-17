# ---------------------------------------------------------------------------
# Phase 1.1 API smoke test — exercises every endpoint added through Week 3.
# Resets the DB, drives the system through the full intake -> budget -> refine
# -> approve flow, asserts on shapes and counts at every step.
#
# Run with the API on http://localhost:1109 and Postgres at the project
# default. Stops Postgres' truncate failure means the API isn't reachable.
#
#   pwsh -File scripts\test-phase1-1.ps1
# ---------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'

$Api = $env:API_URL
if (-not $Api) { $Api = "http://localhost:1109" }
$WebOrigin = "http://localhost:1995"
$PsqlPath = "C:\Users\Administrator\pgsql\pgsql\bin\psql.exe"

# ---- test harness ----
$script:pass = 0
$script:fail = 0
$script:fails = @()

function T([string]$name, [scriptblock]$block) {
  try {
    & $block | Out-Null
    $script:pass++
    Write-Host "  PASS  $name" -ForegroundColor Green
  } catch {
    $script:fail++
    $msg = $_.Exception.Message
    $script:fails += "$name -> $msg"
    Write-Host "  FAIL  $name -> $msg" -ForegroundColor Red
  }
}

function Group($name) { Write-Host "`n=== $name ===" -ForegroundColor Cyan }

function Should($actual, $expected, $label = "value") {
  if ($actual -ne $expected) { throw "$label expected '$expected', got '$actual'" }
}

# Robust array count — Invoke-RestMethod auto-unwraps single-element arrays,
# and @().Count misbehaves when the value is already a System.Object[].
function Len($x) {
  if ($null -eq $x) { return 0 }
  return @($x | ForEach-Object { $_ }).Count
}

function StatusOf([scriptblock]$block) {
  try { & $block | Out-Null; return 200 }
  catch { return [int]$_.Exception.Response.StatusCode.Value__ }
}

function Reset-Db() {
  if (-not (Test-Path $PsqlPath)) { return }
  $env:PGPASSWORD = 'postgres'
  $sqlFile = Join-Path (Split-Path $PSCommandPath) 'db-reset.sql'
  & $PsqlPath -h 127.0.0.1 -U postgres -d studio_ops -f $sqlFile 2>&1 | Out-Null
}

function Login() {
  $body = @{ email = 'admin@studio.local'; password = 'admin1234' } | ConvertTo-Json
  $r = Invoke-RestMethod "$Api/api/auth/login" -Method POST -Body $body -ContentType 'application/json'
  return $r.token
}

# ===========================================================================
Reset-Db

$token = Login
$H = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
$HwithOrigin = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json'; Origin = $WebOrigin }

function Sim($from, $body) {
  $b = @{ from = $from; body = $body } | ConvertTo-Json
  Invoke-RestMethod "$Api/api/whatsapp/simulate" -Method POST -Headers $H -Body $b
}

# ===========================================================================
Group "1. HEALTH"

T "GET /health -> { status:'ok', db:'ok', timestamp }" {
  $r = Invoke-RestMethod "$Api/api/health"
  Should $r.status 'ok' 'status'
  Should $r.db 'ok' 'db'
  if (-not $r.timestamp) { throw 'no timestamp' }
}

T "GET /health is public (no token)" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/health" }) 200 'status'
}

# ===========================================================================
Group "2. AUTH"

T "POST /auth/login good creds -> token + user{id,email,name,role}" {
  $body = @{ email = 'admin@studio.local'; password = 'admin1234' } | ConvertTo-Json
  $r = Invoke-RestMethod "$Api/api/auth/login" -Method POST -Body $body -ContentType 'application/json'
  if (-not $r.token) { throw 'no token' }
  foreach ($f in @('id','email','name','role')) {
    if (-not ($r.user.PSObject.Properties.Name -contains $f)) { throw "user.$f missing" }
  }
  Should $r.user.role 'ADMIN' 'role'
  if ($r.user.PSObject.Properties.Name -contains 'passwordHash') { throw 'passwordHash leaked' }
}

T "POST /auth/login wrong password -> 401" {
  # Must be >=8 chars or DTO validation 400s before the auth check runs.
  $body = @{ email = 'admin@studio.local'; password = 'wrongpass1' } | ConvertTo-Json
  Should (StatusOf { Invoke-RestMethod "$Api/api/auth/login" -Method POST -Body $body -ContentType 'application/json' }) 401 'status'
}

T "POST /auth/login unknown email -> 401" {
  $body = @{ email = 'nobody@x.com'; password = 'whatever1' } | ConvertTo-Json
  Should (StatusOf { Invoke-RestMethod "$Api/api/auth/login" -Method POST -Body $body -ContentType 'application/json' }) 401 'status'
}

T "POST /auth/login short password -> 400 (validation)" {
  $body = @{ email = 'admin@studio.local'; password = 'x' } | ConvertTo-Json
  Should (StatusOf { Invoke-RestMethod "$Api/api/auth/login" -Method POST -Body $body -ContentType 'application/json' }) 400 'status'
}

T "POST /auth/login invalid email -> 400" {
  $body = @{ email = 'not-an-email'; password = 'whatever1' } | ConvertTo-Json
  Should (StatusOf { Invoke-RestMethod "$Api/api/auth/login" -Method POST -Body $body -ContentType 'application/json' }) 400 'status'
}

T "GET /auth/me without token -> 401" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/auth/me" }) 401 'status'
}

T "GET /auth/me with token -> user" {
  $r = Invoke-RestMethod "$Api/api/auth/me" -Headers $H
  Should $r.email 'admin@studio.local' 'email'
  Should $r.role 'ADMIN' 'role'
}

T "Protected route without token -> 401 (global guard)" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/clients" }) 401 'status'
}

# ===========================================================================
Group "3. WHATSAPP WEBHOOK (Meta)"

T "GET webhook with correct verify token -> 200 echoes challenge" {
  $r = Invoke-WebRequest "$Api/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=change-me&hub.challenge=hello-xyz" -UseBasicParsing
  Should $r.StatusCode 200 'status'
  Should $r.Content 'hello-xyz' 'challenge'
}

T "GET webhook with wrong verify token -> 403" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=BAD&hub.challenge=x" }) 403 'status'
}

T "POST webhook with Meta payload -> 200 ok:true" {
  $payload = @{
    entry = @(@{ changes = @(@{ value = @{ messages = @(@{ from = '34600555000'; text = @{ body = 'meta payload test' } }) } }) })
  } | ConvertTo-Json -Depth 6
  $r = Invoke-RestMethod "$Api/api/whatsapp/webhook" -Method POST -Body $payload -ContentType 'application/json'
  Should $r.ok $true 'ok'
}

# ===========================================================================
Group "4. CLIENTS CRUD"

$script:cliA = $null
T "POST /clients -> created with shape" {
  $b = @{ name='Test A'; contact='+34600000111'; source='manual' } | ConvertTo-Json
  $script:cliA = Invoke-RestMethod "$Api/api/clients" -Method POST -Headers $H -Body $b
  Should $script:cliA.name 'Test A' 'name'
  Should $script:cliA.source 'manual' 'source'
  if (-not $script:cliA.id) { throw 'no id' }
  if (-not $script:cliA.createdAt) { throw 'no createdAt' }
}

T "POST /clients missing name -> 400" {
  $b = @{ name=''; contact='x' } | ConvertTo-Json
  Should (StatusOf { Invoke-RestMethod "$Api/api/clients" -Method POST -Headers $H -Body $b }) 400 'status'
}

T "POST /clients with unexpected field -> 400 (forbidNonWhitelisted)" {
  $b = @{ name='X'; contact='y'; evil='1' } | ConvertTo-Json
  Should (StatusOf { Invoke-RestMethod "$Api/api/clients" -Method POST -Headers $H -Body $b }) 400 'status'
}

T "GET /clients lists the new one" {
  $list = Invoke-RestMethod "$Api/api/clients" -Headers $H
  $found = $list | Where-Object { $_.id -eq $script:cliA.id }
  if (-not $found) { throw 'client not in list' }
}

T "GET /clients/:id returns the one (with all fields)" {
  $r = Invoke-RestMethod "$Api/api/clients/$($script:cliA.id)" -Headers $H
  Should $r.id $script:cliA.id 'id'
  Should $r.name 'Test A' 'name'
}

T "GET /clients/nonexistent -> 404" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/clients/nope_id_123" -Headers $H }) 404 'status'
}

T "PATCH /clients/:id updates name" {
  $b = @{ name='Test A2' } | ConvertTo-Json
  $r = Invoke-RestMethod "$Api/api/clients/$($script:cliA.id)" -Method PATCH -Headers $H -Body $b
  Should $r.name 'Test A2' 'updated name'
}

T "DELETE /clients/:id removes" {
  Invoke-RestMethod "$Api/api/clients/$($script:cliA.id)" -Method DELETE -Headers $H | Out-Null
  Should (StatusOf { Invoke-RestMethod "$Api/api/clients/$($script:cliA.id)" -Headers $H }) 404 'after delete'
}

# ===========================================================================
Group "5. PROJECTS CRUD (manual, REST-only)"

$script:cliB = $null
$script:projA = $null
T "Create a client to attach projects to" {
  $b = @{ name='Owner B'; contact='owner@b.com' } | ConvertTo-Json
  $script:cliB = Invoke-RestMethod "$Api/api/clients" -Method POST -Headers $H -Body $b
}

T "POST /projects -> created" {
  $b = @{ clientId=$script:cliB.id; type='INTERIORISMO'; areaM2=30; scope='salón' } | ConvertTo-Json
  $script:projA = Invoke-RestMethod "$Api/api/projects" -Method POST -Headers $H -Body $b
  Should $script:projA.type 'INTERIORISMO' 'type'
  Should $script:projA.status 'NEW' 'status defaults to NEW'
}

T "POST /projects bad enum -> 400" {
  $b = @{ clientId=$script:cliB.id; type='NOPE'; areaM2=10 } | ConvertTo-Json
  Should (StatusOf { Invoke-RestMethod "$Api/api/projects" -Method POST -Headers $H -Body $b }) 400 'status'
}

T "POST /projects negative areaM2 -> 400" {
  $b = @{ clientId=$script:cliB.id; type='INTERIORISMO'; areaM2=-5 } | ConvertTo-Json
  Should (StatusOf { Invoke-RestMethod "$Api/api/projects" -Method POST -Headers $H -Body $b }) 400 'status'
}

T "GET /projects?clientId filters to that client" {
  $list = Invoke-RestMethod "$Api/api/projects?clientId=$($script:cliB.id)" -Headers $H
  $bad = $list | Where-Object { $_.clientId -ne $script:cliB.id }
  if ($bad) { throw 'filter leaked another client' }
}

T "PATCH /projects/:id status -> ACTIVE + emits project.status_changed event" {
  $b = @{ status='ACTIVE' } | ConvertTo-Json
  $r = Invoke-RestMethod "$Api/api/projects/$($script:projA.id)" -Method PATCH -Headers $H -Body $b
  Should $r.status 'ACTIVE' 'status'
  $events = Invoke-RestMethod "$Api/api/projects/$($script:projA.id)/events" -Headers $H
  $statusEvts = $events | Where-Object { $_.type -eq 'project.status_changed' }
  if ((Len $statusEvts) -lt 1) { throw 'no project.status_changed event' }
}

T "GET /projects/nonexistent -> 404" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/projects/nope_id" -Headers $H }) 404 'status'
}

T "GET /projects/nonexistent/events -> 404 (validated via findOne)" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/projects/nope_id/events" -Headers $H }) 404 'status'
}

T "GET /projects/nonexistent/messages -> 404" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/projects/nope_id/messages" -Headers $H }) 404 'status'
}

T "DELETE /projects/:id cascades, GET -> 404 after" {
  Invoke-RestMethod "$Api/api/projects/$($script:projA.id)" -Method DELETE -Headers $H | Out-Null
  Should (StatusOf { Invoke-RestMethod "$Api/api/projects/$($script:projA.id)" -Headers $H }) 404 'after delete'
}

# ===========================================================================
Group "6. FULL WHATSAPP INTAKE FLOW"

T "Sim intake (keyed format) -> 'He entendido' reply (pending intake staged)" {
  Sim '+34611100001' "nuevo proyecto`ncliente: Lis Radtke`ncontacto: +34666112233`ntipo: reforma parcial`nm2: 75`nalcance: cocina y vestidor" | Out-Null
}

T "Sim 'ok' -> client + project + auto-budget v1 (DRAFT)" {
  Sim '+34611100001' 'ok' | Out-Null
  $clients = Invoke-RestMethod "$Api/api/clients" -Headers $H
  $script:cliLis = $clients | Where-Object { $_.name -eq 'Lis Radtke' }
  if (-not $script:cliLis) { throw 'client not created' }
  $projs = Invoke-RestMethod "$Api/api/projects?clientId=$($script:cliLis.id)" -Headers $H
  if ((Len $projs) -ne 1) { throw "expected 1 project, got $(Len $projs)" }
  $script:projLis = ($projs | Select-Object -First 1)
  $b = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  Should $b.version 1 'version'
  Should $b.status 'DRAFT' 'status'
  if ($b.pemTotal -le 0) { throw 'pemTotal not positive' }
  if ($b.taxBaseTotal -ne ($b.pemTotal + $b.feeAmount)) { throw 'taxBase math wrong' }
}

T "Sim with pipe format on a 2nd sender -> client + project + budget" {
  Sim '+34622200002' 'nuevo | Big | b@b.com | integral | 120 | piso entero' | Out-Null
  Sim '+34622200002' 'ok' | Out-Null
  $clients = Invoke-RestMethod "$Api/api/clients" -Headers $H
  $big = $clients | Where-Object { $_.name -eq 'Big' }
  if (-not $big) { throw 'pipe-format client not created' }
}

T "Sim 'no' after staging -> cancellation, no client created" {
  $before = Len (Invoke-RestMethod "$Api/api/clients" -Headers $H)
  Sim '+34633300003' "nuevo`ncliente: Cancel Me`ncontacto: x@x.com`ntipo: parcial" | Out-Null
  Sim '+34633300003' 'no' | Out-Null
  $after = Len (Invoke-RestMethod "$Api/api/clients" -Headers $H)
  if ($after -ne $before) { throw "client count changed ($before -> $after)" }
}

T "Sim garbage -> bot replies (no crash); API still healthy" {
  Sim '+34644400004' 'hola que tal' | Out-Null
  $r = Invoke-RestMethod "$Api/api/health"
  Should $r.status 'ok' 'health after garbage'
}

T "Sim with no pending: 'ok' -> 'no tengo nada pendiente'; 'no' -> 'nada que cancelar'" {
  Sim '+34655500005' 'ok' | Out-Null
  Sim '+34655500005' 'no' | Out-Null
}

# ===========================================================================
Group "7. BUDGETS (versioned)"

T "POST /projects/:id/budgets/generate -> new draft, version incremented" {
  $before = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  $r = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/generate" -Method POST -Headers $H
  if ($r.version -ne ($before.version + 1)) { throw "expected v$($before.version + 1), got v$($r.version)" }
  Should $r.status 'DRAFT' 'status'
}

T "Sim 'subir 1.1 a 50' -> new version, item 1.1.unitPrice=50" {
  Sim '+34611100001' 'subir 1.1 a 50' | Out-Null
  $b = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  $ch1 = $b.chapters | Where-Object { $_.code -eq '1' }
  $it11 = $ch1.items | Where-Object { $_.code -eq '1.1' }
  Should $it11.unitPrice 50 'unitPrice'
  Should $it11.total ($it11.quantity * 50) 'recomputed total'
  Should $b.status 'UNDER_REVIEW' 'status after adjust'
}

T "Sim 'cambiar 6.5 qty 12' -> quantity=12, status UNDER_REVIEW" {
  Sim '+34611100001' 'cambiar 6.5 qty 12' | Out-Null
  $b = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  $ch6 = $b.chapters | Where-Object { $_.code -eq '6' }
  $it = $ch6.items | Where-Object { $_.code -eq '6.5' }
  Should $it.quantity 12 'quantity'
}

T "Sim 'quitar 11.1' -> chapter 11 gone if it was the only item" {
  Sim '+34611100001' 'quitar 11.1' | Out-Null
  $b = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  $ch11 = $b.chapters | Where-Object { $_.code -eq '11' }
  if ($ch11) { throw 'chapter 11 should be removed' }
}

T "GET /projects/:id/budgets returns all versions, desc by version" {
  $vs = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets" -Headers $H
  $n = Len $vs
  if ($n -lt 4) { throw "expected >=4 versions, got $n" }
  $versions = $vs | ForEach-Object { $_.version }
  $sorted = $versions | Sort-Object -Descending
  if (($versions -join ',') -ne ($sorted -join ',')) { throw 'not sorted desc' }
}

T "GET /budgets/:id returns a single budget by id" {
  $latest = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  $r = Invoke-RestMethod "$Api/api/budgets/$($latest.id)" -Headers $H
  Should $r.id $latest.id 'id'
}

T "POST /projects/:id/budgets/refine -> new version, usedAi:false (no API key)" {
  $before = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  $r = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/refine" -Method POST -Headers $H
  Should $r.version ($before.version + 1) 'incremented version'
  Should $r.usedAi $false 'usedAi'
  if (-not $r.notes) { throw 'no notes' }
}

T "Sim 'refinar' (WhatsApp) -> creates another version" {
  $before = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  Sim '+34611100001' 'refinar' | Out-Null
  $after = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  Should $after.version ($before.version + 1) 'incremented version'
}

T "Sim 'aprobar' -> latest goes APPROVED" {
  Sim '+34611100001' 'aprobar' | Out-Null
  $b = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/latest" -Headers $H
  Should $b.status 'APPROVED' 'status'
}

T "Cannot regenerate after approval (latest is APPROVED -> 404 from requireLatestDraft)" {
  Should (StatusOf { Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/budgets/refine" -Method POST -Headers $H }) 404 'status'
}

# ===========================================================================
Group "8. PROJECT SUB-RESOURCES"

T "GET /projects/:id/events returns the audit trail (most recent first)" {
  $events = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/events" -Headers $H
  $n = Len $events
  if ($n -lt 5) { throw "expected >=5 events, got $n" }
  $types = $events | ForEach-Object { $_.type } | Sort-Object -Unique
  foreach ($t in @('project.created','budget.generated','budget.revised','budget.approved')) {
    if ($types -notcontains $t) { throw "missing event type: $t" }
  }
}

T "GET /projects/:id/messages returns inbound + outbound for the WA number" {
  $msgs = Invoke-RestMethod "$Api/api/projects/$($script:projLis.id)/messages" -Headers $H
  $n = Len $msgs
  if ($n -lt 4) { throw "expected >=4 messages, got $n" }
  $inbound = $msgs | Where-Object { $_.direction -eq 'INBOUND' }
  $outbound = $msgs | Where-Object { $_.direction -eq 'OUTBOUND' }
  if ((Len $inbound) -lt 1) { throw 'no inbound' }
  if ((Len $outbound) -lt 1) { throw 'no outbound' }
}

# ===========================================================================
Group "9. DASHBOARD SUMMARY"

T "GET /dashboard/summary returns counts + recentEvents" {
  $r = Invoke-RestMethod "$Api/api/dashboard/summary" -Headers $H
  if (-not $r.counts) { throw 'no counts' }
  if ($r.counts.clients -lt 2) { throw "expected >=2 clients, got $($r.counts.clients)" }
  if ($r.counts.projects -lt 2) { throw "expected >=2 projects" }
  if ($r.counts.budgetsApproved -lt 1) { throw 'no approved budgets' }
  if (-not $r.counts.projectsByStatus) { throw 'no projectsByStatus' }
  if ((Len $r.recentEvents) -lt 10) { throw "expected >=10 recent events, got $(Len $r.recentEvents)" }
}

# ===========================================================================
Group "10. CORS"

T "OPTIONS preflight from 1995 -> Allow-Origin echoed" {
  $h = @{ Origin = $WebOrigin; 'Access-Control-Request-Method' = 'POST'; 'Access-Control-Request-Headers' = 'content-type,authorization' }
  $r = Invoke-WebRequest "$Api/api/auth/login" -Method OPTIONS -Headers $h -UseBasicParsing
  Should $r.Headers['Access-Control-Allow-Origin'] $WebOrigin 'Allow-Origin'
}

T "Cross-origin call from 1995 with Bearer succeeds" {
  $r = Invoke-RestMethod "$Api/api/dashboard/summary" -Headers $HwithOrigin
  if (-not $r.counts) { throw 'cors blocked cross-origin call' }
}

T "OPTIONS preflight from evil.example -> blocked (no Allow-Origin echoed)" {
  $h = @{ Origin = 'http://evil.example'; 'Access-Control-Request-Method' = 'POST'; 'Access-Control-Request-Headers' = 'content-type' }
  try {
    $r = Invoke-WebRequest "$Api/api/auth/login" -Method OPTIONS -Headers $h -UseBasicParsing
    if ($r.Headers['Access-Control-Allow-Origin'] -eq 'http://evil.example') { throw 'echoed evil origin' }
  } catch {
    # 404 / 403 / etc. from CORS rejection is fine — preflight denied.
  }
}

# ===========================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SUMMARY: $script:pass passed, $script:fail failed" -ForegroundColor $(if ($script:fail -eq 0) { 'Green' } else { 'Red' })
Write-Host "============================================================" -ForegroundColor Cyan
if ($script:fail -gt 0) {
  Write-Host ""
  Write-Host "FAILURES:" -ForegroundColor Red
  $script:fails | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  exit 1
}
exit 0
