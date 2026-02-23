// Plugin para cargar el polyfill de Temporal API necesario para Schedule-X
// Se ejecuta solo en el cliente para evitar errores de SSR

export default defineNuxtPlugin(async () => {
  // @ts-ignore
  if (!(globalThis as any).Temporal) {
    try {
      const { Temporal } = await import('temporal-polyfill')
      // @ts-ignore
      globalThis.Temporal = Temporal
      console.log('✅ Temporal polyfill cargado')
    } catch (e) {
      console.error('❌ Error cargando Temporal polyfill:', e)
    }
  }
})
