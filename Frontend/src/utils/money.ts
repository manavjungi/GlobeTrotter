export function formatMoney(amount: number, currency = "INR"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  if (currency === "INR") {
    return `₹${value.toLocaleString("en-IN")}`;
  }
  return `${currency} ${value.toLocaleString("en-IN")}`;
}
