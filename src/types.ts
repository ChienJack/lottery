export interface Participant {
  id: string;
  name: string;
  department?: string;
  email?: string;
  weight: number;
  eligible: boolean;
  attended: boolean;
}

export interface Prize {
  id: string;
  name: string;
  quantity: number;
  remaining: number;
  group?: string;
  order: number;
  allowRepeatWin: boolean;
  icon?: string;
}

export interface Session {
  id: string;
  name: string;
  prizeIds: string[];
  scheduledAt?: string;
  publicAnimation: boolean;
  active: boolean;
}

export type DrawStatus = 'CONFIRMED' | 'CANCELLED' | 'RETRIED';

export interface DrawRecord {
  id: string;
  sessionId: string;
  prizeId: string;
  participantId: string;
  drawnAt: string;
  operator?: string;
  status: DrawStatus;
  note?: string;
}

export interface VisualSettings {
  brandColor: string;
  accentColor: string;
  backgroundImage: string;
  logoUrl: string;
  headline: string;
  marquee: string;
  animationStyle: 'pop' | 'slide' | 'flip';
}
