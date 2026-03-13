/**
 * Endpoint de Health Check
 * Devuelve el estado básico de la aplicación
 * Nota: No verifica DB para evitar dependencias complejas en build
 */
export default defineEventHandler(async (event) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    service: 'intranet-app'
  }
})
