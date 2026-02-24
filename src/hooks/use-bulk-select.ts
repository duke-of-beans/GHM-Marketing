// useBulkSelect — shared multi-select state for any list/table
// Usage: const { selected, toggle, toggleAll, clear, isSelected, count } = useBulkSelect(items)
import { useState, useCallback, useMemo } from "react";

export function useBulkSelect<T extends { id: number }>(items: T[]) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === items.length
        ? new Set()
        : new Set(items.map(i => i.id))
    );
  }, [items]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: number) => selected.has(id), [selected]);

  const allSelected = useMemo(() =>
    items.length > 0 && selected.size === items.length, [items, selected]);

  const someSelected = useMemo(() =>
    selected.size > 0 && selected.size < items.length, [items, selected]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return { selected, selectedIds, toggle, toggleAll, clear, isSelected, allSelected, someSelected, count: selected.size };
}
