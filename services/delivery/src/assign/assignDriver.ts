export function assignDriver(orderId: string): string {
  return `driver-${Math.floor(Math.random() * 1000)}`;
}
