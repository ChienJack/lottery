<template>
  <div class="ops-shell">
    <aside class="sidebar">
      <div class="label">功能</div>
      <div class="sidebar-nav">
        <button class="nav-item" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
          <span class="nav-icon">📊</span><span>Dashboard</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'prizes' }" @click="activeTab = 'prizes'">
          <span class="nav-icon">🎁</span><span>獎項設定</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'participants' }" @click="activeTab = 'participants'">
          <span class="nav-icon">🧑‍🤝‍🧑</span><span>抽獎名單</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'winners' }" @click="activeTab = 'winners'">
          <span class="nav-icon">🏅</span><span>中獎名單</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'visual' }" @click="activeTab = 'visual'">
          <span class="nav-icon">🎨</span><span>視覺設定</span>
        </button>
      </div>
      <button style="margin-top: 8px;" @click="openAudience">開啟觀眾視窗</button>
    </aside>

    <div class="stack" style="gap: 16px;">
      <section v-if="activeTab === 'dashboard'" class="card stack">
        <div class="grid two">
          <div class="stack">
            <div>
              <h2>場次 / 獎項控制</h2>
              <p class="muted">切換場次、選擇獎項、設定抽取人數並執行抽獎</p>
            </div>
            <label>
              場次
              <select v-model="selectedSessionId">
                <option v-for="s in store.sessions" :key="s.id" :value="s.id">
                  {{ s.name }} {{ s.active ? '' : '(停用)' }}
                </option>
              </select>
            </label>
            <label>
              獎項
              <select v-model="selectedPrizeId">
                <option v-for="p in store.availablePrizes" :key="p.id" :value="p.id">
                  {{ p.name }} · 剩餘 {{ p.remaining }}/{{ p.quantity }}
                </option>
              </select>
            </label>
            <div class="grid two">
              <label>
                抽取人數
                <input type="number" min="1" v-model.number="count" />
              </label>
              <label>
                操作者
                <input type="text" v-model="operator" placeholder="主持人 / HR" />
              </label>
            </div>
            <label>
              備註
              <textarea rows="2" v-model="note" placeholder="倒數設定、指定原因等"></textarea>
            </label>
            <div class="grid two">
              <div class="stack">
                <div class="muted">觀眾模式連結</div>
                <code>/#/audience</code>
              </div>
              <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px">
                <span class="muted">剩餘獎項：{{ remainingPrizes }}</span>
                <button :disabled="!selectedPrizeId || !selectedSessionId" @click="handleDraw">抽獎</button>
              </div>
            </div>
            <p v-if="message" :style="{ color: messageType === 'error' ? '#b91c1c' : '#0f766e' }">
              {{ message }}
            </p>
          </div>

          <div class="stack card" style="height: 100%;">
            <div>
              <h2>現場狀態</h2>
              <p class="muted">最新抽獎結果與控制記錄</p>
            </div>
            <div class="list" style="flex: 1;">
              <div v-for="record in recentDraws" :key="record.id" class="list-item">
                <div class="stack" style="gap: 4px">
                  <strong>{{ winnerName(record.participantId) }}</strong>
                  <span class="muted">{{ prizeName(record.prizeId) }} · {{ formatTime(record.drawnAt) }}</span>
                </div>
                <div class="pill">
                  {{ record.status === 'CONFIRMED' ? '已揭曉' : record.status }}
                </div>
              </div>
              <p v-if="recentDraws.length === 0" class="muted">尚無抽獎紀錄，請先執行抽獎。</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'winners'" class="card stack">
        <div class="grid two">
          <div class="stack">
            <h2>中獎名單</h2>
            <p class="muted">顯示已揭曉的紀錄，可撤銷單筆並釋放獎項數量。</p>
          </div>
          <div class="stack" style="align-items: flex-end;">
            <button @click="exportWinners">匯出中獎紀錄</button>
            <p class="muted" style="text-align: right;">匯出包含得主、獎項、時間、操作者、備註。</p>
          </div>
        </div>
        <div class="list">
          <div v-for="record in winnerList" :key="record.id" class="list-item">
            <div class="stack" style="gap: 4px;">
              <strong>{{ winnerName(record.participantId) }}</strong>
              <span class="muted">{{ prizeName(record.prizeId) }} · {{ formatTime(record.drawnAt) }}</span>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <div class="pill">{{ record.status }}</div>
              <button type="button" @click="cancel(record.id)">撤銷</button>
            </div>
          </div>
          <p v-if="winnerList.length === 0" class="muted">尚無中獎紀錄。</p>
        </div>
      </section>

      <section v-if="activeTab === 'prizes'" class="card stack">
        <div>
          <h2>獎項設定</h2>
          <p class="muted">批次匯入或手動調整獎項順序、數量、是否允許重複得獎。</p>
        </div>
        <div class="grid two">
          <div class="stack">
            <label>
              獎項匯入 (Excel)
              <input type="file" accept=".xlsx,.xls" @change="onPrizesFile" />
            </label>
            <div class="list">
              <div
                v-for="p in sortedPrizes"
                :key="p.id"
                class="list-item draggable"
                :class="{ dragging: draggingId === p.id }"
                draggable="true"
                @dragstart="onDragStart(p.id)"
                @dragover.prevent
                @drop="onDrop(p.id)"
              >
                <div class="stack" style="gap: 6px;">
                  <strong>{{ p.name }}</strong>
                  <span class="muted">組別 {{ p.group || 'N/A' }} · 順序 {{ p.order }}</span>
                  <div class="grid two">
                    <label>
                      數量
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <button type="button" @click="adjustQuantity(p, -1)" :disabled="p.quantity <= 1">-</button>
                        <input
                          type="number"
                          min="1"
                          :value="p.quantity"
                          @input="onQuantityInput($event, p)"
                          style="max-width: 90px;"
                        />
                        <button type="button" @click="adjustQuantity(p, 1)">+</button>
                      </div>
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px;">
                      <input type="checkbox" :checked="p.allowRepeatWin" @change="toggleRepeat(p)" />
                      允許重複得獎
                    </label>
                  </div>
                  <span class="muted">剩餘 {{ p.remaining }}/{{ p.quantity }}</span>
                </div>
                <div class="pill">拖曳調整</div>
              </div>
            </div>
          </div>
          <div class="stack">
            <p class="muted">拖曳可調整順序；即時修改數量與重複得獎設定。</p>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'participants'" class="card stack">
        <div>
          <h2>抽獎名單</h2>
          <p class="muted">批次匯入或快速檢視參與者；匯入將重置抽獎紀錄。</p>
        </div>
        <div class="grid two">
          <div class="stack">
            <label>
              參與者匯入 (Excel)
              <input type="file" accept=".xlsx,.xls" @change="onParticipantsFile" />
            </label>
            <div class="list">
              <div v-for="p in store.participants" :key="p.id" class="list-item">
                <div class="stack" style="gap: 4px;">
                  <strong>{{ p.name }}</strong>
                  <span class="muted">{{ p.department || '未填部門' }} · 權重 {{ p.weight }} · {{ p.eligible ? '可抽' : '排除' }}</span>
                </div>
                <div class="pill">{{ p.attended ? '已到場' : '未到場' }}</div>
              </div>
            </div>
          </div>
          <div class="stack">
            <p class="muted">匯入新名單會清空抽獎紀錄並重置獎項剩餘，請先備份。</p>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'visual'" class="card stack">
        <div>
          <h2>視覺設定</h2>
          <p class="muted">設定觀眾端的品牌色、背景、Logo、標語與揭曉動畫風格。</p>
        </div>
        <div class="grid two">
          <div class="stack">
            <label>
              品牌色
              <input type="color" v-model="visual.brandColor" @change="saveVisual" />
            </label>
            <label>
              強調色
              <input type="color" v-model="visual.accentColor" @change="saveVisual" />
            </label>
            <label>
              背景圖（URL）
              <input type="text" v-model="visual.backgroundImage" placeholder="https://..." @change="saveVisual" />
            </label>
            <label>
              Logo（URL）
              <input type="text" v-model="visual.logoUrl" placeholder="https://..." @change="saveVisual" />
            </label>
          </div>
          <div class="stack">
            <label>
              標語 / 標題
              <input type="text" v-model="visual.headline" placeholder="現場抽獎" @change="saveVisual" />
            </label>
            <label>
              跑馬燈文字
              <input type="text" v-model="visual.marquee" placeholder="中獎名單將於此處即時更新" @change="saveVisual" />
            </label>
            <label>
              揭曉動畫
              <select v-model="visual.animationStyle" @change="saveVisual">
                <option value="pop">彈跳</option>
                <option value="slide">上滑</option>
                <option value="flip">翻轉</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section class="card stack">
        <div>
          <h2>資料匯入 / 匯出</h2>
          <p class="muted">支援 Excel 批次匯入參與者與獎項；可匯出中獎紀錄。</p>
        </div>
        <div class="grid two">
          <div class="stack">
            <label>
              參與者匯入 (姓名、部門、Email、權重)
              <input type="file" accept=".xlsx,.xls" @change="onParticipantsFile" />
            </label>
            <label>
              獎項匯入 (獎項名稱、數量、組別、允許重複)
              <input type="file" accept=".xlsx,.xls" @change="onPrizesFile" />
            </label>
          </div>
          <div class="stack" style="align-items: flex-end;">
            <button @click="exportWinners">匯出中獎紀錄</button>
            <p class="muted" style="text-align: right;">匯出包含得主、獎項、時間、操作者、備註。</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useLotteryStore } from '../stores/lottery';
import { parseParticipants, parsePrizes, exportWinners as exportWinnersToExcel } from '../utils/excel';
import type { Prize, DrawRecord } from '../types';

type MessageType = 'error' | 'success';

export default defineComponent({
  name: 'OperatorDashboard',
  data() {
    const store = useLotteryStore();
    const visual = { ...store.visualSettings };
    return {
      store,
      activeTab: 'dashboard',
      selectedSessionId: store.currentSessionId || (store.sessions[0]?.id ?? ''),
      selectedPrizeId: store.availablePrizes[0]?.id ?? '',
      count: 1,
      operator: '',
      note: '',
      message: '',
      messageType: 'success' as MessageType,
      draggingId: null as string | null,
      visual,
    };
  },
  computed: {
    recentDraws(): typeof this.store.draws {
      return this.store.draws
        .filter((d) => d.sessionId === this.store.currentSessionId)
        .sort((a, b) => b.drawnAt.localeCompare(a.drawnAt));
    },
    remainingPrizes(): number {
      return this.store.availablePrizes.reduce((sum, p) => sum + p.remaining, 0);
    },
    sortedPrizes(): typeof this.store.prizes {
      return [...this.store.prizes].sort((a, b) => a.order - b.order);
    },
    winnerList(): DrawRecord[] {
      return this.store.draws
        .filter((d) => d.status === 'CONFIRMED')
        .sort((a, b) => b.drawnAt.localeCompare(a.drawnAt));
    },
  },
  watch: {
    selectedSessionId: {
      immediate: true,
      handler(id: string) {
        this.store.setSession(id);
        this.selectedPrizeId = this.store.availablePrizes[0]?.id ?? '';
      },
    },
  },
  mounted() {
    if (!this.selectedSessionId && this.store.sessions[0]) {
      this.selectedSessionId = this.store.sessions[0].id;
    }
    if (!this.selectedPrizeId && this.store.availablePrizes[0]) {
      this.selectedPrizeId = this.store.availablePrizes[0].id;
    }
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
    openAudience() {
      window.open('#/audience', '_blank', 'noopener');
    },
    async onParticipantsFile(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const rows = await parseParticipants(file);
        if (!rows.length) {
          this.message = '匯入失敗，檔案內沒有有效的姓名列';
          this.messageType = 'error';
          input.value = '';
          return;
        }
        this.store.replaceParticipants(rows);
        this.message = `已匯入 ${rows.length} 筆參與者，抽獎紀錄已重置`;
        this.messageType = 'success';
      } catch (err) {
        this.message = err instanceof Error ? err.message : '匯入參與者失敗';
        this.messageType = 'error';
      } finally {
        input.value = '';
      }
    },
    async onPrizesFile(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const rows = await parsePrizes(file);
        if (!rows.length) {
          this.message = '匯入失敗，檔案內沒有有效的獎項列';
          this.messageType = 'error';
          input.value = '';
          return;
        }
        this.store.replacePrizes(rows);
        this.message = `已匯入 ${rows.length} 筆獎項並重置抽獎紀錄`;
        this.messageType = 'success';
      } catch (err) {
        this.message = err instanceof Error ? err.message : '匯入獎項失敗';
        this.messageType = 'error';
      } finally {
        input.value = '';
      }
    },
    exportWinners() {
      if (!this.store.draws.length) {
        this.message = '目前沒有中獎紀錄可匯出';
        this.messageType = 'error';
        return;
      }
      exportWinnersToExcel(this.store.draws, this.store.participants, this.store.prizes);
      this.message = '已匯出中獎紀錄 (winners.xlsx)';
      this.messageType = 'success';
    },
    cancel(id: string) {
      this.store.cancelDraw(id, '操作者撤銷');
      this.message = '已撤銷並釋放獎項數量';
      this.messageType = 'success';
    },
    adjustQuantity(prize: Prize, delta: number) {
      const next = Math.max(1, prize.quantity + delta);
      this.store.updatePrize(prize.id, { quantity: next });
    },
    onQuantityInput(event: Event, prize: Prize) {
      const value = Number((event.target as HTMLInputElement).value);
      const next = Number.isFinite(value) && value > 0 ? value : prize.quantity;
      this.store.updatePrize(prize.id, { quantity: next });
    },
    toggleRepeat(prize: Prize) {
      this.store.updatePrize(prize.id, { allowRepeatWin: !prize.allowRepeatWin });
    },
    onDragStart(id: string) {
      this.draggingId = id;
    },
    onDrop(targetId: string) {
      if (!this.draggingId || this.draggingId === targetId) return;
      const ids = [...this.sortedPrizes];
      const fromIndex = ids.findIndex((p) => p.id === this.draggingId);
      const toIndex = ids.findIndex((p) => p.id === targetId);
      const moved = ids.splice(fromIndex, 1)[0];
      ids.splice(toIndex, 0, moved);
      this.store.reorderPrizes(ids.map((p) => p.id));
      this.draggingId = null;
    },
    handleDraw() {
      this.message = '';
      if (!this.selectedPrizeId) {
        this.message = '請選擇獎項';
        this.messageType = 'error';
        return;
      }
      try {
        const winners = this.store.draw(this.selectedPrizeId, this.count, this.operator, this.note);
        if (winners.length === 0) {
          this.message = '沒有符合資格的參與者';
          this.messageType = 'error';
          return;
        }
        this.message = `已抽出 ${winners.map((w) => w.name).join(', ')}`;
        this.messageType = 'success';
      } catch (err) {
        this.message = err instanceof Error ? err.message : '抽獎失敗';
        this.messageType = 'error';
      }
    },
    saveVisual() {
      this.store.updateVisualSettings(this.visual);
      this.message = '已更新觀眾端視覺設定';
      this.messageType = 'success';
    },
  },
});
</script>
