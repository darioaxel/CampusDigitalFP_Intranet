#!/bin/bash

# =============================================================================
# SCRIPT DE DEPLOY PARA GITHUB ACTIONS - Campus Digital FP Intranet
# =============================================================================
# Ubicación en servidor: /apps/intranet/deploy-github.sh

set -e

APP_DIR="/apps/intranet"
BACKUP_DIR="/apps/backups/intranet"
DB_BACKUP_DIR="/apps/backups/intranet/db"

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

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║     DEPLOY AUTOMÁTICO - Campus Digital FP Intranet              ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que estamos en el directorio correcto
cd "$APP_DIR"
log_info "Directorio de trabajo: $(pwd)"

# =============================================================================
# BACKUP DE BASE DE DATOS
# =============================================================================

log_info "Creando backup de base de datos..."
mkdir -p "$DB_BACKUP_DIR"

DB_BACKUP_FILE="$DB_BACKUP_DIR/intranet-db-$(date +%Y%m%d-%H%M%S).sql"

if docker ps -q -f name=intranet-postgres | grep -q .; then
    docker exec intranet-postgres pg_dump -U intranet campus_intranet > "$DB_BACKUP_FILE" 2>/dev/null || true
    if [ -f "$DB_BACKUP_FILE" ] && [ -s "$DB_BACKUP_FILE" ]; then
        log_success "Backup de BD creado: $DB_BACKUP_FILE"
        gzip "$DB_BACKUP_FILE" 2>/dev/null || true
    else
        log_warning "No se pudo crear backup de BD (puede ser la primera vez)"
        rm -f "$DB_BACKUP_FILE"
    fi
else
    log_warning "Contenedor de PostgreSQL no está corriendo"
fi

# Limpiar backups antiguos (mantener últimos 10)
ls -t "$DB_BACKUP_DIR"/intranet-db-*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f

# =============================================================================
# ACTUALIZAR CÓDIGO
# =============================================================================

log_info "Actualizando código desde GitHub..."

# Configurar git (por si acaso)
git config user.email "deploy@darioaxel.dev" 2>/dev/null || true
git config user.name "Deploy Bot" 2>/dev/null || true

# Hacer fetch
git fetch origin

# Detectar la rama principal (main o master)
if git show-ref --verify --quiet refs/remotes/origin/main; then
    BRANCH="main"
elif git show-ref --verify --quiet refs/remotes/origin/master; then
    BRANCH="master"
else
    log_error "No se encontró rama main ni master"
    exit 1
fi

log_info "Usando rama: $BRANCH"

# Reset hard para tener exactamente lo que hay en GitHub
git reset --hard "origin/$BRANCH"
log_success "Código actualizado a: $(git rev-parse --short HEAD)"

# =============================================================================
# VERIFICAR VARIABLES DE ENTORNO
# =============================================================================

if [ ! -f ".env" ]; then
    log_error "No se encontró archivo .env"
    log_info "Por favor, crea el archivo .env en $APP_DIR/.env"
    exit 1
fi

log_success "Archivo .env encontrado"

# =============================================================================
# BUILD Y DEPLOY (Docker)
# =============================================================================

log_info "Deteniendo contenedores actuales..."
docker compose down

log_info "Limpiando imágenes antiguas..."
docker system prune -f

log_info "Construyendo imágenes..."
docker compose build --no-cache

log_info "Iniciando servicios..."
docker compose up -d

# =============================================================================
# EJECUTAR MIGRACIONES DE PRISMA
# =============================================================================

log_info "Ejecutando migraciones de base de datos..."
sleep 5  # Esperar a que PostgreSQL esté listo

docker exec intranet-app npx prisma migrate deploy || {
    log_warning "No se pudieron ejecutar migraciones automáticamente"
    log_info "Puedes ejecutarlas manualmente con: docker exec intranet-app npx prisma migrate deploy"
}

# =============================================================================
# VERIFICACIÓN
# =============================================================================

log_info "Verificando despliegue..."
sleep 10

# Verificar que los contenedores están corriendo
if docker ps | grep -q intranet-postgres; then
    log_success "Contenedor PostgreSQL está corriendo"
else
    log_error "El contenedor PostgreSQL no se inició"
    docker logs intranet-postgres --tail 20
    exit 1
fi

if docker ps | grep -q intranet-app; then
    log_success "Contenedor de la app está corriendo"
else
    log_error "El contenedor de la app no se inició"
    docker logs intranet-app --tail 20
    exit 1
fi

# Health check
log_info "Esperando health check..."
sleep 10

if docker exec intranet-app wget -q --spider http://localhost:3000/api/health 2>/dev/null; then
    log_success "Health check: OK"
else
    log_warning "Health check no responde aún (puede tardar unos segundos más)"
    log_info "Verificando logs..."
    docker logs intranet-app --tail 30
fi

# =============================================================================
# RESUMEN
# =============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    DEPLOY COMPLETADO ✅                          ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📅 Fecha: $(date)"
echo "🔀 Commit: $(git rev-parse --short HEAD)"
echo "👤 Usuario: $(whoami)"
echo ""
echo "🐋 Contenedores:"
docker ps --filter name=intranet --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo ""
echo "🌐 URLs:"
echo "   • Producción: https://intranet.darioaxel.dev"
echo ""
echo "📋 Comandos útiles:"
echo "   • Ver logs app:     docker logs -f intranet-app"
echo "   • Ver logs BD:      docker logs -f intranet-postgres"
echo "   • Acceder a BD:     docker exec -it intranet-postgres psql -U intranet -d campus_intranet"
echo "   • Migraciones:      docker exec intranet-app npx prisma migrate deploy"
echo "   • Reiniciar:        docker compose restart"
echo ""
