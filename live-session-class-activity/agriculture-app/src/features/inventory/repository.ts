import type { SQLiteDatabase } from 'expo-sqlite';

import { parseNonNegativeQuantity, requiredText } from '@/utils/validation';

export type SupplyItem = {
  id: number;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type SupplyInput = {
  name: string;
  category: string;
  unit: string;
  quantity: string | number;
};

function normalizeSupply(input: SupplyInput) {
  return {
    name: requiredText(input.name, 'Supply name'),
    category: requiredText(input.category, 'Category'),
    unit: requiredText(input.unit, 'Unit'),
    quantity: parseNonNegativeQuantity(input.quantity),
  };
}

export function listSupplies(db: SQLiteDatabase) {
  return db.getAllAsync<SupplyItem>('SELECT * FROM supply_items ORDER BY name COLLATE NOCASE');
}

export async function createSupply(db: SQLiteDatabase, input: SupplyInput) {
  const supply = normalizeSupply(input);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO supply_items (name, category, unit, quantity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    supply.name,
    supply.category,
    supply.unit,
    supply.quantity,
    now,
    now,
  );
}

export async function updateSupply(db: SQLiteDatabase, id: number, input: SupplyInput) {
  const supply = normalizeSupply(input);
  const result = await db.runAsync(
    `UPDATE supply_items SET name = ?, category = ?, unit = ?, quantity = ?, updated_at = ? WHERE id = ?`,
    supply.name,
    supply.category,
    supply.unit,
    supply.quantity,
    new Date().toISOString(),
    id,
  );
  if (result.changes !== 1) throw new Error('Supply was not found.');
}

export async function deleteSupply(db: SQLiteDatabase, id: number) {
  const result = await db.runAsync('DELETE FROM supply_items WHERE id = ?', id);
  if (result.changes !== 1) throw new Error('Supply was not found.');
}
