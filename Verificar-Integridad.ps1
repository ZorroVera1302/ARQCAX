# Comprueba si algún archivo público cambió desde el último manifiesto aprobado.
# Ejecuta: powershell -ExecutionPolicy Bypass -File .\Verificar-Integridad.ps1
$raiz = Split-Path -Parent $PSCommandPath
$manifiesto = Join-Path $raiz 'integridad-manifiesto.json'
if (-not (Test-Path -LiteralPath $manifiesto)) { throw 'Falta integridad-manifiesto.json.' }

$esperado = Get-Content -LiteralPath $manifiesto -Raw | ConvertFrom-Json
$actual = Get-ChildItem -LiteralPath $raiz -File -Recurse |
    Where-Object { $_.Name -notin @('integridad-manifiesto.json', 'Verificar-Integridad.ps1', 'Actualizar-Integridad.ps1') } |
    ForEach-Object {
        [PSCustomObject]@{
            Archivo = $_.FullName.Substring($raiz.Length + 1).Replace('\', '/')
            SHA256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
        }
    }

$problemas = @()
foreach ($archivo in $esperado.archivos) {
    $encontrado = $actual | Where-Object Archivo -eq $archivo.Archivo
    if (-not $encontrado) { $problemas += "Falta: $($archivo.Archivo)" }
    elseif ($encontrado.SHA256 -ne $archivo.SHA256) { $problemas += "Modificado: $($archivo.Archivo)" }
}
foreach ($archivo in $actual) {
    if (-not ($esperado.archivos.Archivo -contains $archivo.Archivo)) { $problemas += "Archivo nuevo: $($archivo.Archivo)" }
}

if ($problemas.Count) {
    Write-Error ("ALERTA DE INTEGRIDAD:`n" + ($problemas -join "`n"))
    exit 1
}
Write-Host 'Integridad correcta: no se detectaron cambios no aprobados.' -ForegroundColor Green