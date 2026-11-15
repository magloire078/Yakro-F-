import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Montant formaté en FCFA.
 *
 * `toLocaleString('fr-FR')` insère une espace fine insécable (U+202F) ; on la
 * remplace par une espace normale pour que la séparation des milliers reste
 * lisible avec les polices éditoriales (Fraunces).
 */
export function formatFcfa(montant: number): string {
  return `${montant.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`
}
