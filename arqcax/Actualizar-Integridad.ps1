# Ejecuta este archivo SOLO después de revisar y aprobar cambios intencionales.
$raiz = Split-Path -Parent $PSCommandPath
$salida = Join-Path $raiz 'integridad-manifiesto.json'
$archivos = Get-ChildItem -LiteralPath $raiz -File -Recurse |
    Where-Object { $_.Name -notin @('integridad-manifiesto.json', 'Verificar-Integridad.ps1', 'Actualizar-Integridad.ps1') } |
    ForEach-Object {
        [PSCustomObject]@{
            Archivo = $_.FullName.Substring($raiz.Length + 1).Replace('\', '/')
            SHA256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
        }
    }
[PSCustomObject]@{
    generadoEn = (Get-Date).ToUniversalTime().ToString('o')
    algoritmo = 'SHA-256'
    archivos = @($archivos)
} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $salida -Encoding utf8
Write-Host 'Manifiesto actualizado. Revisa los cambios antes de publicar.' -ForegroundColor Yellow