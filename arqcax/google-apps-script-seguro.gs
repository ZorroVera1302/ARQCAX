/**
 * Endpoint seguro para las cotizaciones de ARQCAX.
 * Configura estas propiedades en Apps Script > Project Settings > Script properties:
 *   SHEET_ID, TURNSTILE_SECRET, ALLOWED_HOSTNAME
 * Opcional: SHEET_NAME (por defecto: Cotizaciones)
 */
const PROPS = PropertiesService.getScriptProperties();

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    const turnstile = String(payload.turnstileToken || '');
    if (!validarTurnstile_(turnstile)) return respuesta_({ ok: false, error: 'Verificación anti-bots fallida.' });

    const datos = normalizarDatos_(payload);
    if (!datos) return respuesta_({ ok: false, error: 'Datos inválidos.' });

    // Límite por correo: evita reenvíos repetidos sin guardar datos sensibles en caché.
    const clave = 'rate:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, datos.correo));
    const cache = CacheService.getScriptCache();
    if (cache.get(clave)) return respuesta_({ ok: false, error: 'Espera un minuto antes de reenviar.' });

    const bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(10000);
    try {
      const hoja = SpreadsheetApp.openById(requerida_('SHEET_ID')).getSheetByName(PROPS.getProperty('SHEET_NAME') || 'Cotizaciones');
      if (!hoja) throw new Error('No se encontró la hoja de cotizaciones.');
      hoja.appendRow([new Date(), datos.pais, datos.nombre, datos.apellido, datos.correo, datos.celular, datos.terreno, datos.departamento, datos.distrito, datos.inversion_minima, datos.fecha, datos.horario]);
      cache.put(clave, '1', 60);
    } finally {
      bloqueo.releaseLock();
    }
    return respuesta_({ ok: true });
  } catch (error) {
    console.error(error);
    return respuesta_({ ok: false, error: 'No se pudo procesar la solicitud.' });
  }
}

function validarTurnstile_(token) {
  if (!token || token.length > 2048) return false;
  const respuesta = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post',
    payload: { secret: requerida_('TURNSTILE_SECRET'), response: token },
    muteHttpExceptions: true
  });
  const resultado = JSON.parse(respuesta.getContentText());
  return resultado.success === true && resultado.hostname === requerida_('ALLOWED_HOSTNAME');
}

function normalizarDatos_(origen) {
  const campos = ['pais', 'nombre', 'apellido', 'correo', 'celular', 'terreno', 'departamento', 'distrito', 'inversion_minima', 'fecha', 'horario'];
  const datos = {};
  campos.forEach(campo => datos[campo] = limpiar_(origen[campo], campo === 'correo' ? 100 : 150));
  if (!datos.nombre || !datos.apellido || !datos.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) return null;
  return datos;
}

function limpiar_(valor, maximo) {
  let texto = String(valor || '').trim().replace(/[<>]/g, '').slice(0, maximo);
  // Evita inyección de fórmulas al abrir la hoja en Google Sheets o Excel.
  if (/^[=+\-@\t\r]/.test(texto)) texto = "'" + texto;
  return texto;
}

function requerida_(nombre) {
  const valor = PROPS.getProperty(nombre);
  if (!valor) throw new Error('Falta la propiedad: ' + nombre);
  return valor;
}

function respuesta_(cuerpo) {
  return ContentService.createTextOutput(JSON.stringify(cuerpo)).setMimeType(ContentService.MimeType.JSON);
}