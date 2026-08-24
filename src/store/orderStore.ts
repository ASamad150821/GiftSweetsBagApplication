import { create } from 'zustand'
import { getSupabase } from '../lib/supabaseClient'

export type CustomerDetails = {
  name: string
  email: string
  address: string
  city: string
  postcode: string
}

export const PRICE_PER_BAG = 6.5

const emptyCustomer : CustomerDetails = {
  name: '',
  email: '',
  address: '',
  city: '',
  postcode: ''
}

function generateOrderNumber() {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SB-${random}`
}

type OrderState = {
  quantity: number
  personalMessage: string
  customer: CustomerDetails
  orderNumber: string | null
  setQuantity: (quantity: number) => void
  setPersonalMessage: (message: string) => void
  setCustomer: (customer: CustomerDetails) => void
  placeOrder: () => Promise<string>
  reset: () => void
}

export let useOrderStore = create<OrderState>((set, get) => ({
  quantity: 1,
  personalMessage: '',
  customer: emptyCustomer,
  orderNumber: null,
  setQuantity: (quantity) => set({ quantity }),
  setPersonalMessage: (message) => set({ personalMessage: message }),
  setCustomer: (customer) => set({ customer }),
  placeOrder: async () => {
    const existingOrderNumber = get().orderNumber
    if (existingOrderNumber) return existingOrderNumber

    const { quantity, personalMessage, customer } = get()
    const orderNumber = generateOrderNumber()
    const totalPrice = Number((quantity * PRICE_PER_BAG).toFixed(2))

    const { error } = await getSupabase().from('orders').insert({
      order_number: orderNumber,
      quantity,
      personal_message: personalMessage || null,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_address: customer.address,
      customer_city: customer.city,
      customer_postcode: customer.postcode,
      total_price: totalPrice,
    })

    if (error) throw error

    set({ orderNumber })
    return orderNumber
  },
  reset: () => {
    set({
      quantity: 1,
      personalMessage: '',
      customer: emptyCustomer,
      orderNumber: null
    })
  }
}))





