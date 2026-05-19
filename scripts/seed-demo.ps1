# ---------------------------------------------------------------------------
# Seeds a few clients + projects + budgets via the real API/WhatsApp flow.
# Useful for showing the UI populated. Idempotent enough to run repeatedly —
# duplicates are fine for demo purposes.
#
# Requires the API at http://localhost:1109.
#   pwsh -File scripts\seed-demo.ps1
# ---------------------------------------------------------------------------

$Api = "http://localhost:1109"

$body = @{ email='admin@studio.local'; password='admin1234' } | ConvertTo-Json
$token = (Invoke-RestMethod "$Api/api/auth/login" -Method POST -Body $body -ContentType 'application/json').token
$H = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

function Sim($from, $b) {
  $p = @{ from = $from; body = $b } | ConvertTo-Json
  Invoke-RestMethod "$Api/api/whatsapp/simulate" -Method POST -Headers $H -Body $p | Out-Null
}

# ---- Lis Radtke — reforma parcial cocina + vestidor, mid-review ----
Sim "+34611100001" "nuevo proyecto`ncliente: Lis Radtke`ncontacto: +34666112233`ntipo: reforma parcial`nm2: 75`nalcance: cocina y vestidor"
Sim "+34611100001" "ok"
Sim "+34611100001" "subir 1.1 a 50"
Sim "+34611100001" "quitar 11.1"

# ---- Mikel Garaikoa — reforma integral, approved ----
Sim "+34611100002" "nuevo proyecto`ncliente: Mikel Garaikoa`ncontacto: mikel@example.com`ntipo: reforma integral`nm2: 120`nalcance: piso entero"
Sim "+34611100002" "ok"
Sim "+34611100002" "refinar"
Sim "+34611100002" "aprobar"

# ---- Estudio Aranzazu — interiorismo, draft only ----
Sim "+34611100003" "nuevo`ncliente: Estudio Aranzazu`ncontacto: +34699887766`ntipo: interiorismo`nm2: 40`nalcance: oficina"
Sim "+34611100003" "ok"

# ---- Carmen Ibarra — reforma parcial baño, single adjustment ----
Sim "+34611100004" "nuevo proyecto`ncliente: Carmen Ibarra`ncontacto: carmen@example.com`ntipo: reforma parcial`nm2: 12`nalcance: baño completo"
Sim "+34611100004" "ok"
Sim "+34611100004" "cambiar 6.5 qty 4"

Write-Host "Demo data seeded." -ForegroundColor Green
$clients = Invoke-RestMethod "$Api/api/clients" -Headers $H
Write-Host "  $($clients.Count) client(s)"
$projects = Invoke-RestMethod "$Api/api/projects" -Headers $H
Write-Host "  $($projects.Count) project(s)"
