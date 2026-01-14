import * as XLSX from 'xlsx';
import type { Participant, Prize, DrawRecord } from '../types';

type ParticipantInput = Omit<Participant, 'id'>;
type PrizeInput = Omit<Prize, 'id' | 'remaining'>;

const participantKeys = {
  name: ['name', '姓名'],
  department: ['department', '部門'],
  email: ['email', 'Email', 'mail'],
  weight: ['weight', '權重'],
  eligible: ['eligible', '可抽', '可抽取'],
  attended: ['attended', '出席', '到場'],
};

const prizeKeys = {
  name: ['name', '獎項名稱', '獎品', 'prize'],
  quantity: ['quantity', '數量', 'qty'],
  group: ['group', '組別'],
  order: ['order', '順序'],
  allowRepeatWin: ['allowRepeatWin', '允許重複', '可重複'],
  icon: ['icon', '圖示'],
};

function findValue(row: Record<string, any>, aliases: string[]) {
  const key = Object.keys(row).find((k) => aliases.some((alias) => alias.toLowerCase() === String(k).toLowerCase()));
  return key ? row[key] : undefined;
}

async function readWorkbook(file: File) {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: 'array' });
}

export async function parseParticipants(file: File): Promise<ParticipantInput[]> {
  const workbook = await readWorkbook(file);
  const firstSheet = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[firstSheet] || {});

  return rows
    .map((row) => {
      const name = findValue(row, participantKeys.name);
      if (!name) return undefined;
      const weight = Number(findValue(row, participantKeys.weight) ?? 1);
      return {
        name: String(name).trim(),
        department: findValue(row, participantKeys.department)?.toString() || '',
        email: findValue(row, participantKeys.email)?.toString() || '',
        weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
        eligible: String(findValue(row, participantKeys.eligible) ?? 'true').toLowerCase() !== 'false',
        attended: String(findValue(row, participantKeys.attended) ?? 'true').toLowerCase() !== 'false',
      };
    })
    .filter(Boolean) as ParticipantInput[];
}

export async function parsePrizes(file: File): Promise<PrizeInput[]> {
  const workbook = await readWorkbook(file);
  const firstSheet = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[firstSheet] || {});

  return rows
    .map((row) => {
      const name = findValue(row, prizeKeys.name);
      if (!name) return undefined;
      const quantity = Number(findValue(row, prizeKeys.quantity) ?? 1);
      const order = Number(findValue(row, prizeKeys.order) ?? 0);
      return {
        name: String(name).trim(),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        group: findValue(row, prizeKeys.group)?.toString() || '',
        order: Number.isFinite(order) ? order : 0,
        allowRepeatWin: String(findValue(row, prizeKeys.allowRepeatWin) ?? 'false').toLowerCase() === 'true',
        icon: findValue(row, prizeKeys.icon)?.toString() || '',
      };
    })
    .filter(Boolean) as PrizeInput[];
}

export function exportWinners(
  draws: DrawRecord[],
  participants: Participant[],
  prizes: Prize[],
  filename = 'winners.xlsx',
) {
  const rows = draws.map((d) => {
    const participant = participants.find((p) => p.id === d.participantId);
    const prize = prizes.find((p) => p.id === d.prizeId);
    return {
      Participant: participant?.name ?? '',
      Department: participant?.department ?? '',
      Email: participant?.email ?? '',
      Prize: prize?.name ?? '',
      Group: prize?.group ?? '',
      DrawnAt: d.drawnAt,
      Operator: d.operator ?? '',
      Status: d.status,
      Note: d.note ?? '',
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Winners');
  XLSX.writeFile(workbook, filename);
}
