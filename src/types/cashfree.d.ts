export {};

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: "_self" | "_blank" | "_top" | "_modal" }) => Promise<unknown> | void;
    };
  }
}
