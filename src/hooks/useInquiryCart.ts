import { useCallback, useEffect, useMemo, useState } from "react";
import type { InquiryCartItem } from "@/types/shop";

const STORAGE_KEY = "chah-shop-inquiry-cart";

function loadCart(): InquiryCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.stock_item_id === "string");
  } catch {
    return [];
  }
}

function saveCart(items: InquiryCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useInquiryCart() {
  const [items, setItems] = useState<InquiryCartItem[]>(() => loadCart());

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const addItem = useCallback((stockItemId: string, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.stock_item_id === stockItemId);
      if (existing) {
        return prev.map((item) =>
          item.stock_item_id === stockItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { stock_item_id: stockItemId, quantity }];
    });
  }, []);

  const updateItem = useCallback((stockItemId: string, patch: Partial<InquiryCartItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.stock_item_id === stockItemId ? { ...item, ...patch } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((stockItemId: string) => {
    setItems((prev) => prev.filter((item) => item.stock_item_id !== stockItemId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, totalItems, addItem, updateItem, removeItem, clear };
}
