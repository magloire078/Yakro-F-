import type { IncidentReporter, IncidentType } from './types';

export interface IncidentOption {
  id: IncidentType;
  label: string;
  description: string;
  reporters: IncidentReporter[];
  /** Si true, exige un message texte additionnel. */
  requiresMessage?: boolean;
}

export const INCIDENT_TYPES: IncidentOption[] = [
  {
    id: 'adresse-introuvable',
    label: 'Adresse introuvable',
    description: "Je n'arrive pas à trouver l'adresse de livraison.",
    reporters: ['livreur'],
  },
  {
    id: 'client-absent',
    label: 'Client absent / injoignable',
    description: "Le client ne répond pas et ne se présente pas.",
    reporters: ['livreur'],
  },
  {
    id: 'plat-manquant',
    label: 'Plat manquant',
    description: "Un ou plusieurs plats sont absents de la commande préparée.",
    reporters: ['livreur', 'client'],
    requiresMessage: true,
  },
  {
    id: 'commande-incomplete',
    label: 'Commande incomplète',
    description: "Il manque des éléments dans ma commande.",
    reporters: ['client'],
    requiresMessage: true,
  },
  {
    id: 'plat-froid',
    label: 'Plat froid / abîmé',
    description: "Les plats reçus ne sont pas à la bonne température ou sont abîmés.",
    reporters: ['client'],
  },
  {
    id: 'autre',
    label: 'Autre problème',
    description: "Décrivez le problème dans votre message.",
    reporters: ['client', 'livreur', 'restaurateur'],
    requiresMessage: true,
  },
];

export const getIncidentOption = (id: IncidentType): IncidentOption =>
  INCIDENT_TYPES.find(i => i.id === id) ?? INCIDENT_TYPES[INCIDENT_TYPES.length - 1];

export const incidentsForReporter = (reporter: IncidentReporter): IncidentOption[] =>
  INCIDENT_TYPES.filter(i => i.reporters.includes(reporter));

export const generateIncidentId = (): string =>
  `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
