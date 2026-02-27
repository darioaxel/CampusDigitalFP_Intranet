import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Updater } from '@tanstack/vue-table'
import type { Ref } from 'vue'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper para actualizar refs con TanStack Table
 * Maneja tanto valores directos como funciones updater
 */
export function valueUpdater<T extends Updater<any>>(
  updaterOrValue: T,
  ref: Ref
) {
  ref.value = typeof updaterOrValue === 'function'
    ? (updaterOrValue as Function)(ref.value)
    : updaterOrValue
}
