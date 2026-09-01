# Despliegue y seguridad de ARQCAX

## Publicar el sitio

No tienes que subir los archivos a Google Drive ni a una nube primero. Publica esta carpeta en un hosting estático y luego conecta el dominio. Recomiendo Cloudflare Pages: crea un proyecto, sube esta carpeta y, cuando funcione con la dirección `pages.dev`, agrega tu dominio desde **Custom domains**. El archivo `_headers` de esta carpeta activará cabeceras de seguridad en Cloudflare Pages.

## Proteger Google Sheets

La dirección de Apps Script es visible en el navegador y eso es normal: no pongas contraseñas, claves privadas ni el ID de la hoja en HTML o JavaScript. La protección real va en Apps Script.

1. Crea una cuenta de Cloudflare Turnstile y registra tu dominio. Obtendrás una **site key** pública y una **secret key** privada.
2. En Apps Script, guarda como propiedades del proyecto: `SHEET_ID`, `SHEET_NAME` (opcional), `TURNSTILE_SECRET` y `ALLOWED_HOSTNAME` (por ejemplo, `www.tudominio.com`).
3. Sustituye el código actual de Apps Script por `google-apps-script-seguro.gs` y despliega una nueva versión como aplicación web. El script se ejecuta como tu cuenta, con acceso solo para quien corresponda a tu web pública.
4. Antes de activar esa nueva versión, integra la site key pública de Turnstile en `cotiza.html`; el token se envía como `turnstileToken`. Nunca pongas `TURNSTILE_SECRET` en la web.
5. Comparte la hoja solo con el personal que necesita verla. No la publiques en la web ni habilites edición para “cualquiera con el enlace”.

El script valida cada token en el servidor, comprueba el dominio, limpia los datos, evita fórmulas peligrosas en Sheets y limita reenvíos por correo. Las verificaciones del navegador ayudan, pero no sustituyen estas validaciones de servidor.

## Antes de lanzar

- Usa HTTPS; Cloudflare Pages lo habilita automáticamente.
- Mantén acceso de dos pasos activado en Google y Cloudflare.
- No compartas el enlace de edición de Google Sheets.
- Prueba primero con un dominio de prueba y luego con el dominio final: Turnstile valida el hostname.