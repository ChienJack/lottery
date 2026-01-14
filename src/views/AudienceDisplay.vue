<template>
  <div
    class="audience-hero"
    :style="{
      backgroundImage: visual.backgroundImage
        ? `linear-gradient(135deg, ${visual.brandColor}88, #0f172a), url(${visual.backgroundImage})`
        : undefined,
    }"
  >
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <img v-if="visual.logoUrl" :src="visual.logoUrl" alt="Logo" style="height: 44px; border-radius: 8px;" />
        <div>
          <h2 :style="{ color: visual.brandColor }">{{ visual.headline || '現場抽獎' }}</h2>
          <p class="muted">場次：{{ store.currentSession?.name ?? '未選擇' }}</p>
        </div>
      </div>
      <div class="pill" :style="{ background: `${visual.accentColor}33`, color: visual.accentColor }">LIVE</div>
    </div>

    <div class="stack" style="gap: 16px;">
      <div class="audience-panel">
        <strong>最新揭曉</strong>
        <div v-if="latestDraws.length" class="list" style="margin-top: 12px;">
          <div
            v-for="record in latestDraws"
            :key="record.id"
            class="list-item winner-reveal"
            :style="{ background:'#0b1220', borderColor:'#1f2937', animationName: animationName }"
          >
            <div class="stack" style="gap: 4px;">
              <span style="font-size: 20px; color: #f8fafc;">{{ winnerName(record.participantId) }}</span>
              <span class="muted" style="color: #cbd5e1;">{{ prizeName(record.prizeId) }}</span>
            </div>
            <div class="pill" :style="{ background:`${visual.brandColor}33`, color: visual.brandColor }">
              {{ formatTime(record.drawnAt) }}
            </div>
          </div>
        </div>
        <p v-else class="muted" style="color: #cbd5e1;">待揭曉，請稍候...</p>
      </div>

      <div class="audience-panel">
        <strong>剩餘獎項</strong>
        <div class="grid two" style="margin-top: 12px;">
          <div
            v-for="prize in store.availablePrizes"
            :key="prize.id"
            class="list-item"
            style="background:#0b1220; border-color:#1f2937;"
          >
            <div class="stack" style="gap: 4px;">
              <span style="color: #f8fafc;">{{ prize.name }}</span>
              <span class="muted" style="color: #cbd5e1;">剩餘 {{ prize.remaining }}/{{ prize.quantity }}</span>
            </div>
            <div class="pill" style="background:#22d3ee33; color:#99f6e4;">{{ prize.group ?? 'N/A' }}</div>
          </div>
        </div>
      </div>

      <div class="audience-panel">
        <strong>跑馬燈</strong>
        <p class="muted" style="color: #cbd5e1;">{{ visual.marquee || '請保持安靜，抽獎進行中。' }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useLotteryStore } from '../stores/lottery';

export default defineComponent({
  name: 'AudienceDisplay',
  data() {
    return {
      store: useLotteryStore(),
    };
  },
  computed: {
    latestDraws(): typeof this.store.draws {
      return this.store.draws
        .filter((d) => d.sessionId === this.store.currentSessionId)
        .sort((a, b) => b.drawnAt.localeCompare(a.drawnAt))
        .slice(0, 5);
    },
    visual() {
      return this.store.visualSettings;
    },
    animationName(): string {
      const style = this.store.visualSettings.animationStyle;
      if (style === 'flip') return 'flipIn';
      if (style === 'slide') return 'slideUp';
      return 'popIn';
    },
  },
  methods: {
    winnerName(id: string) {
      return this.store.participants.find((p) => p.id === id)?.name ?? 'Unknown';
    },
    prizeName(id: string) {
      return this.store.prizes.find((p) => p.id === id)?.name ?? '未知獎項';
    },
    formatTime(iso: string) {
      const date = new Date(iso);
      return date.toLocaleTimeString();
    },
  },
});
</script>
