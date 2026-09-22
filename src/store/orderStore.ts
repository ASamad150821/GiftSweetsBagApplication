import { create } from 'zustand'

export type CustomerDetails =  {
  name: string
  email: string
  address: string
  city: string
  postcode: string
}

const emptyCustomer: CustomerDetails = {
  name: '',
  email: '',
  address: '',
  city: '',
  postcode: '',
}

export type PlacedOrder = {
  id: string
  orderNumber: string
  quantity: number
  personalMessage: string
  totalPrice: number
  customer: CustomerDetails
  createdAt: string
}

export const PRICE_PER_BAG = 6.5;

type OrderState = {
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

export const useOrderStore = create<OrderState>((set) => ({
  quantity: 1,
  personalMessage: '',
  customer: emptyCustomer,
  lastOrder: null,
  setQuantity: (quantity) => set({ quantity: quantity }),
  setPersonalMessage: (personalMessage) => set({ personalMessage : personalMessage }),
  setCustomer: (customer) => set({ customer : customer }),
  setLastOrder: (lastOrder) => set({ lastOrder : lastOrder }),
  reset: () =>
    set({
      quantity: 1,
      personalMessage: '',
      customer: emptyCustomer,
      lastOrder: null,
    }),
}))
