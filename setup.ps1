# Script de Setup Automático para QuieroMiSAS
# Guarda este archivo como: setup.ps1
# Ejecuta: .\setup.ps1

Write-Host "🚀 Iniciando setup de QuieroMiSAS..." -ForegroundColor Green

# 1. Desinstalar Prisma 7
Write-Host "`n📦 Desinstalando Prisma 7..." -ForegroundColor Yellow
npm uninstall prisma @prisma/client

# 2. Instalar Prisma 5 (estable)
Write-Host "`n📦 Instalando Prisma 5..." -ForegroundColor Yellow
npm install prisma@5.22.0 @prisma/client@5.22.0

# 3. Verificar versión
Write-Host "`n✅ Verificando versión de Prisma..." -ForegroundColor Yellow
npx prisma --version

# 4. Generar cliente de Prisma
Write-Host "`n🔧 Generando cliente de Prisma..." -ForegroundColor Yellow
npx prisma generate

# 5. Crear migraciones y tablas
Write-Host "`n🗄️ Creando tablas en la base de datos..." -ForegroundColor Yellow
npx prisma migrate dev --name init

Write-Host "`n✨ ¡Setup completado!" -ForegroundColor Green
Write-Host "Ahora ejecuta: npm run dev" -ForegroundColor Cyan