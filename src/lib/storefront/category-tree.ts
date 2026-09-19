import type { Category } from "@/types";

export interface CategoryNode extends Category {
  children: Category[];
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();
  for (const category of categories) {
    if (category.id) nodes.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryNode[] = [];
  for (const category of categories) {
    const node = category.id ? nodes.get(category.id) : undefined;
    if (!node) {
      roots.push({ ...category, children: [] });
      continue;
    }
    const parent = category.parentId ? nodes.get(category.parentId) : undefined;
    if (parent && parent !== node) parent.children.push(category);
    else roots.push(node);
  }
  return roots;
}

export function categoryGroupMap(categories: Category[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const category of categories) groups[category.slug] = [category.slug];

  for (const category of categories) {
    if (!category.parentId || !category.id) continue;
    const parent = categories.find((item) => item.id === category.parentId);
    if (parent) groups[parent.slug]?.push(category.slug);
  }
  return groups;
}
