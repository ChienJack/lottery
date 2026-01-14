<<<<<<< HEAD
# lottery
=======
# Lottery UI (Vue)

Frontend scaffold for the lottery system described in `docs/lottery-requirements.md`. Built with Vite + Vue 3 + TypeScript and Pinia, providing operator and audience modes in a single app.

## Scripts
- `npm install` - install dependencies.
- `npm run dev` - start dev server (hash history; audience view at `/#/audience`).
- `npm run build` - production build.
- `npm run preview` - preview build.
- `npm run type-check` - run `vue-tsc`.
- `npm run electron:dev` - assumes `npm run dev` is running at `http://localhost:5173`, opens Electron pointing to it.
- `npm run electron:prod` - build static assets then open Electron loading `dist/index.html`（離線可用）。
- `npm run dev:all` - 開發模式一次啟動 Vite 與 Electron 外殼。
- `npm start` - 等同 `npm run electron:prod`，直接以離線檔案版啟動兩視窗。

## Structure
- `src/stores/lottery.ts` - in-memory store with weighted draw, repeat-win rule, cancel support.
- `src/views/OperatorDashboard.vue` - controls for session/prize selection and manual draw.
- `src/views/AudienceDisplay.vue` - display latest winners and remaining prizes.
- `docs/lottery-requirements.md` - full requirements reference.

## 功能摘要
- 雙視窗：操作者模式（`/#/`）與觀眾模式（`/#/audience`）同一套程式。
- 抽獎：權重抽籤、每獎項可設定是否允許重複得獎、剩餘數量追蹤。
- Excel 匯入：在操作者面板可匯入參與者（姓名/部門/Email/權重）與獎項（名稱/數量/組別/允許重複）。
- 匯出：中獎紀錄匯出 `winners.xlsx`（得主、獎項、時間、操作者、備註）。
- 離線/包裝：Electron 外殼（`electron/main.js`）可用於 kiosk/離線包；啟動時同時開啟「操作者」與「觀眾」兩視窗，可搭配 `npm run electron:prod`。

## Notes
- 內建種子資料僅供示範，匯入新的 Excel 會重置抽獎紀錄。
- 若要客製更多需求，可參考 `_reference/annual-party-lottery/` 的 React 實作邏輯。
>>>>>>> f29421f (Initial commit)
