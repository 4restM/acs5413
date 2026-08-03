import type { SQLiteDatabase } from 'expo-sqlite';

import { isCashKind, parseCurrencyToCents, requiredText, requireDate, type CashKind } from '@/utils/validation';

export type CashEntry = {
  id: number;
  kind: CashKind;
  amount_cents: number;
  category: string;
  occurred_on: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type CashEntryInput = {
  kind: CashKind;
  amount: string;
  category: string;
  occurredOn: string;
  note?: string;
};

function normalizeEntry(input: CashEntryInput) {
  if (!isCashKind(input.kind)) throw new Error('Choose income or expense.');
  return {
    kind: input.kind,
    amountCents: parseCurrencyToCents(input.amount),
    category: requiredText(input.category, 'Category'),
    occurredOn: requireDate(input.occurredOn),
    note: input.note?.trim() ?? '',
  };
}

export function listCashEntries(db: SQLiteDatabase) {
  return db.getAllAsync<CashEntry>(
    'SELECT * FROM cash_entries ORDER BY occurred_on DESC, created_at DESC',
  );
}

export async function getBalanceCents(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ balance: number | null }>(
    `SELECT COALESCE(SUM(CASE WHEN kind = 'income' THEN amount_cents ELSE -amount_cents END), 0) AS balance
     FROM cash_entries`,
  );
  return row?.balance ?? 0;
}

export async function createCashEntry(db: SQLiteDatabase, input: CashEntryInput) {
  const entry = normalizeEntry(input);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO cash_entries (kind, amount_cents, category, occurred_on, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    entry.kind,
    entry.amountCents,
    entry.category,
    entry.occurredOn,
    entry.note,
    now,
    now,
  );
}

export async function updateCashEntry(db: SQLiteDatabase, id: number, input: CashEntryInput) {
  const entry = normalizeEntry(input);
  const result = await db.runAsync(
    `UPDATE cash_entries
       SET kind = ?, amount_cents = ?, category = ?, occurred_on = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    entry.kind,
    entry.amountCents,
    entry.category,
    entry.occurredOn,
    entry.note,
    new Date().toISOString(),
    id,
  );
  if (result.changes !== 1) throw new Error('Ledger entry was not found.');
}

export async function deleteCashEntry(db: SQLiteDatabase, id: number) {
  const result = await db.runAsync('DELETE FROM cash_entries WHERE id = ?', id);
  if (result.changes !== 1) throw new Error('Ledger entry was not found.');
}
