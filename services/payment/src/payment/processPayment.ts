export function processPayment(orderId: string, amount = 0) {
  // Simulated gateway:
  if (amount <= 0) {
    return { status: 'FAILED', reason: 'Invalid amount' };
  }

  // deterministic success for now
  return { status: 'SUCCEEDED' };
}
