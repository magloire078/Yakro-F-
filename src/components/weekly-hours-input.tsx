'use client';

import * as React from 'react';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import type { DayOfWeek, WeeklyHours } from '@/lib/types';
import { DAY_LABELS, ORDERED_DAYS, DEFAULT_WEEKLY_HOURS } from '@/lib/restaurant-hours';

interface WeeklyHoursInputProps {
  value?: WeeklyHours;
  onChange: (value: WeeklyHours) => void;
}

export function WeeklyHoursInput({ value, onChange }: WeeklyHoursInputProps) {
  const hours = value ?? DEFAULT_WEEKLY_HOURS;

  const update = (day: DayOfWeek, patch: Partial<WeeklyHours[DayOfWeek]>) => {
    onChange({
      ...hours,
      [day]: { ...hours[day], ...patch },
    });
  };

  return (
    <div className="space-y-3">
      {ORDERED_DAYS.map(day => {
        const dayHours = hours[day];
        return (
          <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border p-3">
            <div className="w-28 font-medium">{DAY_LABELS[day]}</div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!dayHours.ferme}
                onCheckedChange={checked => update(day, { ferme: !checked })}
                id={`open-${day}`}
              />
              <Label htmlFor={`open-${day}`} className="text-sm text-muted-foreground">
                {dayHours.ferme ? 'Fermé' : 'Ouvert'}
              </Label>
            </div>
            {!dayHours.ferme && (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={dayHours.ouverture}
                  onChange={e => update(day, { ouverture: e.target.value })}
                  className="w-32"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="time"
                  value={dayHours.fermeture}
                  onChange={e => update(day, { fermeture: e.target.value })}
                  className="w-32"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
