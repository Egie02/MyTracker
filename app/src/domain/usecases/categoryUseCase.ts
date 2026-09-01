import type { Category } from '../models/entities';
import {
  getCategories,
  getCategoryById,
  insertCategory,
  updateCategory,
  archiveCategory,
} from '../../data/repositories/categoryRepository';

export async function listCategories(
  kind?: 'expense' | 'income',
  includeArchived = false
): Promise<Category[]> {
  return getCategories(kind, includeArchived);
}

export async function getCategory(id: string): Promise<Category | null> {
  return getCategoryById(id);
}

export async function createCategory(category: Category): Promise<void> {
  const existing = await getCategories(category.kind, true);
  const duplicate = existing.find(
    (c) =>
      c.name.toLowerCase() === category.name.toLowerCase() &&
      (c.parent_id ?? '') === (category.parent_id ?? '')
  );
  if (duplicate) throw new Error('A category with this name already exists for this kind');
  await insertCategory(category);
}

export async function updateCategoryData(category: Category): Promise<void> {
  const existing = await getCategoryById(category.id);
  if (!existing) throw new Error('Category not found');
  const all = await getCategories(category.kind, true);
  const duplicate = all.find(
    (c) =>
      c.id !== category.id &&
      c.name.toLowerCase() === category.name.toLowerCase() &&
      (c.parent_id ?? '') === (category.parent_id ?? '')
  );
  if (duplicate) throw new Error('A category with this name already exists for this kind');
  await updateCategory(category);
}

export async function archiveCategoryById(id: string): Promise<void> {
  const category = await getCategoryById(id);
  if (!category) throw new Error('Category not found');
  await archiveCategory(id);
}
