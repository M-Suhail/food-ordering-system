import { OrderCreatedV1 } from '@food/shared-types';

export function decideKitchen(order: OrderCreatedV1) {
  if (!order.items || order.items.length === 0) {
    return {
      status: 'REJECTED',
      reason: 'No items in order'
    };
  }

  return {
    status: 'ACCEPTED'
  };
}
