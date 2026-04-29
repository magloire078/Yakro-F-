'use client';

import { AlertTriangle } from 'lucide-react';
import type { OrderIncident } from '@/lib/types';
import { getIncidentOption } from '@/lib/incidents';

const reporterLabels: Record<OrderIncident['signalePar'], string> = {
  client: 'Client',
  livreur: 'Livreur',
  restaurateur: 'Restaurateur',
};

export function IncidentList({ incidents }: { incidents: OrderIncident[] | undefined }) {
  if (!incidents || incidents.length === 0) return null;
  return (
    <div className="space-y-2">
      {incidents.map(inc => {
        const opt = getIncidentOption(inc.type);
        return (
          <div
            key={inc.id}
            className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-3 text-sm"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">{opt.label}</p>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Signalé par {reporterLabels[inc.signalePar]} • {new Date(inc.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
                {inc.message && (
                  <p className="mt-1 text-amber-900 dark:text-amber-100 whitespace-pre-line">
                    «&nbsp;{inc.message}&nbsp;»
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
