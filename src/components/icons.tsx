import {
  Swords,
  Sparkles,
  Crown,
  Wind,
  Music,
  Flower2,
  Trophy,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityIconKey } from '../types/api';

export const ACTIVITY_ICONS: Record<ActivityIconKey, LucideIcon> = {
  karate: Swords,
  dance: Sparkles,
  chess: Crown,
  skating: Wind,
  music: Music,
  yoga: Flower2,
  cricket: Trophy,
};

export const ACTIVITY_ICON_KEYS = Object.keys(ACTIVITY_ICONS) as ActivityIconKey[];

/** Backend `icon` is free-text, not a constrained enum — fall back gracefully for unknown values. */
export function activityIcon(icon: string): LucideIcon {
  return ACTIVITY_ICONS[icon as ActivityIconKey] ?? Target;
}
