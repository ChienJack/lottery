import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Participant, Prize, Session, DrawRecord, VisualSettings } from '../types';

function uuid() {
  return crypto.randomUUID();
}

function pickWeighted<T extends Participant>(items: T[], count: number) {
  const winners: T[] = [];
  const pool = [...items];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    const index = pool.findIndex((p) => {
      roll -= p.weight;
      return roll <= 0;
    });
    const picked = index >= 0 ? pool.splice(index, 1)[0] : pool.pop();
    if (picked) {
      winners.push(picked);
    }
  }
  return winners;
}

export const useLotteryStore = defineStore('lottery', () => {
  const participants = ref<Participant[]>([
    { id: uuid(), name: 'Alex', department: 'HR', email: 'alex@example.com', weight: 1, eligible: true, attended: true },
    { id: uuid(), name: 'Becky', department: 'IT', email: 'becky@example.com', weight: 1, eligible: true, attended: true },
    { id: uuid(), name: 'Chen', department: 'Sales', email: 'chen@example.com', weight: 2, eligible: true, attended: true },
    { id: uuid(), name: 'Dion', department: 'Ops', email: 'dion@example.com', weight: 1, eligible: true, attended: true },
  ]);

  const prizes = ref<Prize[]>([
    { id: uuid(), name: '頭獎 - iPad', quantity: 1, remaining: 1, group: 'A', order: 1, allowRepeatWin: false, icon: '🎁' },
    { id: uuid(), name: '貳獎 - Switch', quantity: 2, remaining: 2, group: 'B', order: 2, allowRepeatWin: false, icon: '🎮' },
    { id: uuid(), name: '參獎 - 禮券', quantity: 3, remaining: 3, group: 'C', order: 3, allowRepeatWin: true, icon: '🎟️' },
  ]);

  const sessions = ref<Session[]>([
    { id: uuid(), name: '尾牙場次', prizeIds: prizes.value.map((p) => p.id), scheduledAt: undefined, publicAnimation: true, active: true },
  ]);

  const draws = ref<DrawRecord[]>([]);
  const currentSessionId = ref(sessions.value[0]?.id || '');
  const visualSettings = ref<VisualSettings>({
    brandColor: '#2563eb',
    accentColor: '#f97316',
    backgroundImage: '',
    logoUrl: '',
    headline: '現場抽獎',
    marquee: '中獎名單將於此處即時更新',
    animationStyle: 'pop',
  });

  const currentSession = computed(() => sessions.value.find((s) => s.id === currentSessionId.value));
  const availablePrizes = computed(() =>
    prizes.value
      .filter((p) => p.remaining > 0 && currentSession.value?.prizeIds.includes(p.id))
      .sort((a, b) => a.order - b.order),
  );

  function setSession(sessionId: string) {
    currentSessionId.value = sessionId;
  }

  function replaceParticipants(list: Omit<Participant, 'id'>[]) {
    participants.value = list.map((p) => ({ ...p, id: uuid() }));
    draws.value = [];
    prizes.value.forEach((p) => {
      p.remaining = p.quantity;
    });
  }

  function replacePrizes(list: Omit<Prize, 'id' | 'remaining'>[]) {
    prizes.value = list.map((p) => ({ ...p, id: uuid(), remaining: p.quantity }));
    draws.value = [];
    const session = currentSession.value;
    const prizeIds = prizes.value.map((p) => p.id);
    if (session) {
      session.prizeIds = prizeIds;
    } else {
      const newSession: Session = {
        id: uuid(),
        name: '預設場次',
        prizeIds,
        scheduledAt: undefined,
        publicAnimation: true,
        active: true,
      };
      sessions.value.push(newSession);
      currentSessionId.value = newSession.id;
    }
  }

  function addParticipant(payload: Omit<Participant, 'id'>) {
    participants.value.push({ ...payload, id: uuid() });
  }

  function addPrize(payload: Omit<Prize, 'id' | 'remaining'>) {
    const newPrize: Prize = { ...payload, id: uuid(), remaining: payload.quantity };
    prizes.value.push(newPrize);
  }

  function updatePrize(id: string, updates: Partial<Prize>) {
    prizes.value = prizes.value.map((p) => {
      if (p.id !== id) return p;
      const drawnCount = p.quantity - p.remaining;
      const nextQuantity = updates.quantity !== undefined ? updates.quantity : p.quantity;
      const nextRemaining = Math.max(0, nextQuantity - drawnCount);
      return {
        ...p,
        ...updates,
        quantity: nextQuantity,
        remaining: nextRemaining,
      };
    });
  }

  function reorderPrizes(orderIds: string[]) {
    prizes.value = prizes.value
      .map((p) => {
        const idx = orderIds.indexOf(p.id);
        return idx >= 0 ? { ...p, order: idx } : p;
      })
      .sort((a, b) => a.order - b.order);
    const session = currentSession.value;
    if (session) {
      session.prizeIds = prizes.value.map((p) => p.id);
    }
  }

  function addSession(payload: Omit<Session, 'id' | 'active'>) {
    const newSession: Session = { ...payload, id: uuid(), active: true };
    sessions.value.push(newSession);
    currentSessionId.value = newSession.id;
  }

  function draw(prizeId: string, count: number, operator?: string, note?: string) {
    const session = currentSession.value;
    if (!session) {
      throw new Error('No active session');
    }
    const prize = prizes.value.find((p) => p.id === prizeId);
    if (!prize) {
      throw new Error('Prize not found');
    }
    if (prize.remaining <= 0) {
      throw new Error('Prize exhausted');
    }

    const alreadyWonIds = new Set(
      draws.value
        .filter((d) => d.sessionId === session.id && d.status === 'CONFIRMED')
        .map((d) => d.participantId),
    );

    const pool = participants.value.filter(
      (p) => p.eligible && p.attended && (prize.allowRepeatWin || !alreadyWonIds.has(p.id)),
    );

    const winners = pickWeighted(pool, Math.min(count, prize.remaining));
    const now = new Date().toISOString();
    winners.forEach((w) => {
      draws.value.push({
        id: uuid(),
        sessionId: session.id,
        prizeId: prize.id,
        participantId: w.id,
        drawnAt: now,
        operator,
        status: 'CONFIRMED',
        note,
      });
    });
    prize.remaining = Math.max(0, prize.remaining - winners.length);
    return winners;
  }

  function cancelDraw(drawId: string, reason?: string) {
    const record = draws.value.find((d) => d.id === drawId);
    if (record && record.status === 'CONFIRMED') {
      record.status = 'CANCELLED';
      record.note = reason;
      const prize = prizes.value.find((p) => p.id === record.prizeId);
      if (prize) {
        prize.remaining += 1;
      }
    }
  }

  function updateVisualSettings(patch: Partial<VisualSettings>) {
    visualSettings.value = { ...visualSettings.value, ...patch };
  }

  return {
    participants,
    prizes,
    sessions,
    draws,
    currentSessionId,
    currentSession,
    availablePrizes,
    visualSettings,
    setSession,
    addParticipant,
    addPrize,
    updatePrize,
    reorderPrizes,
    replaceParticipants,
    replacePrizes,
    addSession,
    draw,
    cancelDraw,
    updateVisualSettings,
  };
});
