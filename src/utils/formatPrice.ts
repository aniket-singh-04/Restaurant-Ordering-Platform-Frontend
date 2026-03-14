const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number) => currencyFormatter.format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value);
