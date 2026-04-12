/** True when the portfolio demo build sets NEXT_PUBLIC_IS_DEMO=true */
export function isDemo(): boolean {
  return process.env.NEXT_PUBLIC_IS_DEMO === "true";
}
