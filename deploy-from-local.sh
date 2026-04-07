#!/bin/bash

# =============================================================================
# SCRIPT DE DEPLOY DESDE PC LOCAL - Campus Digital FP Intranet
# =============================================================================
# EJECUTAR EN TU PC LOCAL (no en el servidor)
# 
# FLUJO:
#   1. Hace build en tu PC local (usa tus 32GB RAM)
#   2. Comprime y copia el build al servidor Hetzner
#   3. Ejecuta deploy en el servidor
#
# REQUISITOS:
#   - Tener configurado acceso SSH al servidor (clave SSH)
#   - Variables SERVER_HOST, SERVER_USER configuradas
# =============================================================================

set -e

# =============================================================================
# CONFIGURACIÓN - AJUSTA ESTOS VALORES
# =============================================================================

# Servidor Hetzner (ajústalo a tus datos)
SERVER_HOST="${SERVER_HOST:-your-hetzner-ip-or-domain}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_DIR="/apps/intranet"

# Archivo temporal para el build
BUILD_ARCHIVE="build-output.tar.gz"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# VERIFICAR CONFIGURACIÓN
# =============================================================================

if [ "$SERVER_HOST" = "your-hetzner-ip-or-domain" ]; then
    echo ""
    log_error "⚠️  CONFIGURACIÓN PENDIENTE"
    echo ""
    echo "Debes configurar las variables de entorno:"
    echo ""
    echo "  export SERVER_HOST='tu-ip-o-dominio-hetzner'"
    echo "  export SERVER_USER='tu-usuario'  # ej: root o deploy"
    echo ""
    echo "O edita este script y modifica las líneas 16-17:"
    echo "  SERVER_HOST='tu-ip-o-dominio-hetzner'"
    echo "  SERVER_USER='tu-usuario'"
    echo ""
    exit 1
fi

# Verificar conexión SSH
log_info "Verificando conexión SSH a $SERVER_USER@$SERVER_HOST..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_HOST" "echo 'OK'" > /dev/null 2>&1; then
    log_error "No se puede conectar por SSH a $SERVER_USER@$SERVER_HOST"
    log_info "Verifica que:"
    log_info "  1. Tienes acceso SSH configurado (clave SSH en ~/.ssh/)"
    log_info "  2. El servidor está encendido y accesible"
    log_info "  3. Las variables SERVER_HOST y SERVER_USER son correctas"
    exit 1
fi
log_success "Conexión SSH verificada"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║     DEPLOY DESDE PC LOCAL - Campus Digital FP Intranet          ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
log_info "Servidor destino: $SERVER_USER@$SERVER_HOST"
log_info "Directorio remoto: $SERVER_DIR"
echo ""

# =============================================================================
# VERIFICAR DEPENDENCIAS LOCALES
# =============================================================================

log_info "Verificando dependencias locales..."

if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm no está instalado. Instálalo con: npm install -g pnpm"
    exit 1
fi

log_success "Node.js $(node --version) y pnpm $(pnpm --version) disponibles"

# =============================================================================
# BUILD LOCAL
# =============================================================================

log_info "=========================================="
log_info "PASO 1: BUILD EN PC LOCAL (32GB RAM)"
log_info "=========================================="

# Configurar memoria para Node.js (usa tu RAM disponible)
export NODE_OPTIONS="--max-old-space-size=16384"  # 16GB para el build
export NODE_ENV=production
export NUXT_TELEMETRY_DISABLED=1

log_info "Configuración de memoria Node.js: 16GB"

# Limpiar build anterior
log_info "Limpiando build anterior..."
rm -rf .output

# Instalar dependencias
log_info "Instalando dependencias..."
pnpm install --frozen-lockfile

# Generar cliente Prisma
log_info "Generando cliente Prisma..."
pnpm prisma generate

# Build de Nuxt
log_info "Ejecutando build de Nuxt (usando 32GB RAM disponibles)..."
pnpm build

if [ ! -d ".output" ]; then
    log_error "El build falló. No se encontró directorio .output/"
    exit 1
fi

log_success "Build local completado exitosamente"

# =============================================================================
# COMPRIMIR Y COPIAR AL SERVIDOR
# =============================================================================

log_info "=========================================="
log_info "PASO 2: COPIAR BUILD AL SERVIDOR"
log_info "=========================================="

# Comprimir el build (excluyendo node_modules que están en el servidor)
log_info "Comprimiendo build..."
tar -czf "$BUILD_ARCHIVE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.nuxt' \
    --exclude='.pnpm-store' \
    .output/ \
    package.json \
    pnpm-lock.yaml \
    prisma/ \
    prisma.config.ts \
    docker-compose.local.yml \
    Dockerfile.local \
    2>/dev/null || true

if [ ! -f "$BUILD_ARCHIVE" ]; then
    log_error "Error al comprimir el build"
    exit 1
fi

BUILD_SIZE=$(du -h "$BUILD_ARCHIVE" | cut -f1)
log_success "Build comprimido: $BUILD_ARCHIVE ($BUILD_SIZE)"

# Crear backup del build anterior en el servidor
log_info "Creando backup del build anterior en servidor..."
ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_DIR && \
    if [ -d .output ]; then \
        mv .output .output.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true; \
    fi" || true

# Copiar al servidor
log_info "Copiando build al servidor (puede tardar unos minutos)..."
scp "$BUILD_ARCHIVE" "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/"

log_success "Build copiado al servidor"

# =============================================================================
# DESPLEGAR EN EL SERVIDOR
# =============================================================================

log_info "=========================================="
log_info "PASO 3: DESPLEGAR EN SERVIDOR"
log_info "=========================================="

# Ejecutar comandos en el servidor remoto
ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_DIR && \
    echo '[INFO] Extrayendo build...' && \
    tar -xzf $BUILD_ARCHIVE && \
    rm $BUILD_ARCHIVE && \
    \
    echo '[INFO] Verificando .env de producción...' && \
    if [ ! -f .env ]; then \
        echo '[ERROR] No existe .env en el servidor. Crearlo manualmente primero.'; \
        exit 1; \
    fi && \
    \
    echo '[INFO] Deteniendo contenedores...' && \
    docker compose -f docker-compose.local.yml down 2>/dev/null || docker compose down && \
    \
    echo '[INFO] Limpiando imágenes antiguas...' && \
    docker system prune -f && \
    \
    echo '[INFO] Construyendo imagen Docker...' && \
    docker compose -f docker-compose.local.yml build --no-cache && \
    \
    echo '[INFO] Iniciando servicios...' && \
    docker compose -f docker-compose.local.yml up -d && \
    \
    echo '[INFO] Ejecutando migraciones...' && \
    sleep 5 && \
    docker exec intranet-app npx prisma migrate deploy || true && \
    \
    echo '[INFO] Verificando salud...' && \
    sleep 10 && \
    if docker exec intranet-app wget -q --spider http://localhost:3000/api/health 2>/dev/null; then \
        echo '[OK] Deploy completado exitosamente'; \
    else \
        echo '[WARN] Health check pendiente, revisa los logs'; \
        docker logs intranet-app --tail 20; \
    fi"

# =============================================================================
# LIMPIEZA LOCAL
# =============================================================================

log_info "Limpiando archivos temporales..."
rm -f "$BUILD_ARCHIVE"

# =============================================================================
# RESUMEN
# =============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║              DEPLOY DESDE PC LOCAL COMPLETADO ✅                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📅 Fecha: $(date)"
echo "💻 PC Local: Build con $(node --version)"
echo "🖥️  Servidor: $SERVER_USER@$SERVER_HOST"
echo ""
echo "🌐 URLs:"
echo "   • Producción: https://intranet.darioaxel.dev"
echo ""
echo "📋 Para ver logs en el servidor:"
echo "   ssh $SERVER_USER@$SERVER_HOST 'docker logs -f intranet-app'"
echo ""

log_success "¡Deploy completado!"
