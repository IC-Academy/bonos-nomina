const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export const money = (n: number) => currency.format(n);

export const percent = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "··";
