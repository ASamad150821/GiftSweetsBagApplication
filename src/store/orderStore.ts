import { create } from 'zustand'

export interface CustomerDetails {
  name: string
  email: string
  address: string
  city: string
  postcode: string
}

export interface PlacedOrder {
  id: string
  orderNumber: string
  quantity: number
  personalMessage: string
  totalPrice: number
  customer: CustomerDetails
  createdAt: string
}

interface OrderState {
  quantity: number
  personalMessage: string
  customer: CustomerDetails
  lastOrder: PlacedOrder | null
  setQuantity: (quantity: number) => void
  setPersonalMessage: (message: string) => void
  setCustomer: (customer: CustomerDetails) => void
  setLastOrder: (order: PlacedOrder) => void
  reset: () => void
}

const emptyCustomer: CustomerDetails = {
  name: '',
  email: '',
  address: '',
  city: '',
  postcode: '',
}

export const PRICE_PER_BAG = 6.5

export const useOrderStore = create<OrderState>((set) => ({
  quantity: 1,
  personalMessage: '',
  customer: emptyCustomer,
  lastOrder: null,
  setQuantity: (quantity) => set({ quantity }),
  setPersonalMessage: (personalMessage) => set({ personalMessage }),
  setCustomer: (customer) => set({ customer }),
  setLastOrder: (lastOrder) => set({ lastOrder }),
  reset: () =>
    set({
      quantity: 1,
      personalMessage: '',
      customer: emptyCustomer,
      lastOrder: null,
    }),
}))
