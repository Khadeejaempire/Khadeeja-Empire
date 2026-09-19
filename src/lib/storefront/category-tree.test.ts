import { describe, expect, it } from "vitest";
import type { Category } from "@/types";
import { buildCategoryTree, categoryGroupMap } from "./category-tree";

const category = (id: string, name: string, parentId: string | null = null): Category => ({
  id,
  slug: name.toLowerCase().replace(/\s+/g, "-") as Category["slug"],
  name,
  description: "",
  image: "",
  parentId,
});

describe("category tree", () => {
  const categories = [
    category("1", "Kurtis"),
    category("2", "Short Kurtis", "1"),
    category("3", "Long Kurtis", "1"),
    category("4", "Dresses"),
  ];

  it("nests children under their parent", () => {
    const tree = buildCategoryTree(categories);
    expect(tree.map((node) => node.name)).toEqual(["Kurtis", "Dresses"]);
    expect(tree[0].children.map((child) => child.name)).toEqual(["Short Kurtis", "Long Kurtis"]);
  });

  it("groups a parent with its children for catalog filtering", () => {
    const groups = categoryGroupMap(categories);
    expect(groups["kurtis"]).toEqual(["kurtis", "short-kurtis", "long-kurtis"]);
    expect(groups["dresses"]).toEqual(["dresses"]);
  });
});
