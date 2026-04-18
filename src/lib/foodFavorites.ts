const STORAGE_KEY = 'akilli-diyet-food-favorites-v1'

export function loadFavoriteFoodIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(
      arr.filter((x): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0),
    )
  } catch {
    return new Set()
  }
}

export function saveFavoriteFoodIds(ids: Set<number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].sort((a, b) => a - b)))
}

/** API / arama sırasını koru: favoriler hep üstte (kendi aralarında eski sıra), diğerleri altta aynı sıra. */
export function sortFoodsByFavorites<T extends { id: number }>(
  foods: T[],
  favoriteIds: Set<number>,
): T[] {
  const indexed = foods.map((f, i) => ({ f, i }))
  indexed.sort((a, b) => {
    const fa = favoriteIds.has(a.f.id)
    const fb = favoriteIds.has(b.f.id)
    if (fa !== fb) return fa ? -1 : 1
    return a.i - b.i
  })
  return indexed.map((x) => x.f)
}
