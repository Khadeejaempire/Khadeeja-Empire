"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";

export function ClearPaidCart() {
  const { clearCart } = useCart();
  useEffect(() => clearCart(), [clearCart]);
  return null;
}
