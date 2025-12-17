# 🧪 Cómo Probar los Recordatorios Localmente

## 📋 Comando para Probar

Ejecuta este comando en PowerShell:

```powershell
$headers = @{ "Authorization" = "Bearer Club_Atletico_Talleres_capo_1913" }
Invoke-WebRequest -Uri http://localhost:3000/api/cron/recordatorios -Headers $headers -UseBasicParsing
```

## ✅ Respuesta Esperada

Si funciona correctamente, verás:

```json
{
  "success": true,
  "mensaje": "Recordatorios procesados exitosamente",
  "resultados": {
    "pagosPendientes": 0,
    "documentosRechazados": 0,
    "tramitesEstancados": 0,
    "denominacionesPorVencer": 0,
    "errores": []
  }
}
```

**Los números en `0` son normales** si no hay pagos/documentos/trámites pendientes en tu base de datos.

---

## 🔧 Si cambias el CRON_SECRET

Si modificas el valor de `CRON_SECRET` en tu `.env`, debes actualizar el comando:

```powershell
$headers = @{ "Authorization" = "Bearer TU_NUEVO_SECRET_AQUI" }
Invoke-WebRequest -Uri http://localhost:3000/api/cron/recordatorios -Headers $headers -UseBasicParsing
```

---

## 🚀 En Producción (Vercel)

En producción, **NO necesitas ejecutar este comando manualmente**. Vercel lo ejecutará automáticamente todos los días a las 9:00 AM gracias a la configuración en `vercel.json`.

---

## 📊 Qué hace el endpoint

Cuando se ejecuta, el sistema:

1. ✅ Busca pagos pendientes con más de 3 o 7 días → Envía recordatorio
2. ✅ Busca documentos rechazados sin resubir después de 7 días → Envía recordatorio
3. ✅ Busca trámites estancados por más de 10 días → Envía recordatorio
4. ✅ Busca denominaciones próximas a vencer (< 5 días) → Envía alerta a admin

---

**¡El sistema de recordatorios automáticos está listo! 🎉**

