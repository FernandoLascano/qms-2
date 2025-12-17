# 📋 Migración: Eventos y Tracking de Tiempo

## 🎯 Cambios Realizados

### 1. **Modelo Evento** (Calendario)
- Nuevo modelo `Evento` en Prisma para gestionar reuniones, vencimientos y fechas importantes
- Tipos de eventos: REUNION_CLIENTE, VENCIMIENTO_DENOMINACION, VENCIMIENTO_PAGO, FECHA_LIMITE_DOCUMENTO, FECHA_LIMITE_TRAMITE, RECORDATORIO, OTRO
- Relaciones con trámites, clientes y administradores

### 2. **Tracking de Tiempo**
- Nuevos campos en el modelo `Tramite` para registrar timestamps de cada etapa:
  - `fechaFormularioCompleto`
  - `fechaDenominacionReservada`
  - `fechaCapitalDepositado`
  - `fechaTasaPagada`
  - `fechaDocumentosRevisados`
  - `fechaDocumentosFirmados`
  - `fechaTramiteIngresado`
  - `fechaSociedadInscripta`

### 3. **Funcionalidades Implementadas**
- ✅ Componente de calendario con react-big-calendar
- ✅ Panel de tracking de tiempo con métricas y gráficos
- ✅ Endpoints API para gestionar eventos
- ✅ Endpoint para obtener métricas de tiempo
- ✅ Creación automática de eventos cuando se completan etapas
- ✅ Cálculo de tiempos promedio por etapa
- ✅ Identificación de cuellos de botella

---

## 🚀 Pasos para Aplicar la Migración

### Paso 1: Ejecutar la Migración de Prisma

```bash
npx prisma migrate dev --name add_eventos_y_tracking_tiempo
```

**Nota:** Si el comando falla porque el entorno no es interactivo, puedes usar:

```bash
npx prisma db push
```

Esto aplicará los cambios directamente a la base de datos sin crear un archivo de migración.

### Paso 2: Regenerar el Cliente de Prisma

```bash
npx prisma generate
```

### Paso 3: Verificar que Todo Funcione

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Accede al panel de administración:
   - Ve a `/dashboard/admin`
   - Deberías ver dos nuevas tarjetas: "Calendario de Eventos" y "Tracking de Tiempo"

3. Prueba el calendario:
   - Haz clic en "Calendario de Eventos"
   - Intenta crear un nuevo evento
   - Verifica que se muestre en el calendario

4. Prueba el tracking de tiempo:
   - Haz clic en "Tracking de Tiempo"
   - Verifica que se muestren las métricas (puede estar vacío si no hay trámites completados)

---

## 📝 Notas Importantes

1. **Datos Existentes**: Los trámites que ya están en proceso no tendrán timestamps de etapas anteriores. Solo se registrarán timestamps para etapas que se completen después de aplicar esta migración.

2. **Eventos Automáticos**: Los eventos se crearán automáticamente cuando:
   - Se reserva una denominación → Crea evento de vencimiento (30 días después)
   - Se ingresa el trámite → Crea evento de fecha límite estimada (45 días después)

3. **Tracking de Tiempo**: El sistema calculará automáticamente:
   - Tiempo promedio por etapa
   - Tiempo total del proceso
   - Cuellos de botella (etapas que toman más tiempo)

---

## 🔧 Solución de Problemas

### Error: "Unknown argument 'eventos'"
- **Causa**: El cliente de Prisma no está actualizado
- **Solución**: Ejecuta `npx prisma generate`

### Error: "Table 'Evento' does not exist"
- **Causa**: La migración no se aplicó correctamente
- **Solución**: Ejecuta `npx prisma db push` o `npx prisma migrate deploy`

### El calendario no se muestra correctamente
- **Causa**: Los estilos CSS no se cargaron
- **Solución**: Verifica que `app/globals.css` tenga los estilos de react-big-calendar

---

## 📚 Archivos Creados/Modificados

### Nuevos Archivos:
- `app/api/admin/eventos/route.ts` - Endpoint para crear/obtener eventos
- `app/api/admin/eventos/[id]/route.ts` - Endpoint para actualizar/eliminar eventos
- `app/api/admin/tracking-tiempo/route.ts` - Endpoint para métricas de tiempo
- `components/admin/CalendarioEventos.tsx` - Componente de calendario
- `components/admin/TrackingTiempo.tsx` - Componente de tracking
- `app/dashboard/admin/calendario/page.tsx` - Página del calendario
- `app/dashboard/admin/tracking-tiempo/page.tsx` - Página de tracking

### Archivos Modificados:
- `prisma/schema.prisma` - Agregado modelo Evento y campos de tracking
- `app/api/admin/tramites/[id]/etapas/route.ts` - Agregado registro de timestamps y creación de eventos
- `app/dashboard/admin/page.tsx` - Agregados enlaces a nuevas funcionalidades
- `app/globals.css` - Agregados estilos para react-big-calendar

---

**Última actualización:** Diciembre 2025

