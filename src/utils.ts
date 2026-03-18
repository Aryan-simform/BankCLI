import type { SortOrder } from "./types.js";

export function sortBy<T, K extends keyof T>(arr: T[], key: K, order: SortOrder = "asc"): T[] {

  return arr.slice().sort((a: T, b: T) => {

    const valA = a[key];
    const valB = b[key];

    if (valA < valB) {
      return order === "asc" ? -1 : 1;
    }
    if (valA > valB) {
      return order === "asc" ? 1 : -1;
    }
    return 0;

  });
}
