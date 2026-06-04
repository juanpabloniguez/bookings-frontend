export type AppointmentStatus = "pending" | "confirmed" | "paid";

export type Appointment = {
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
  customerName?: string;
  businessName?: string;
};

//customers
export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  business: string;
  businessId?: number;
};

//businesses
export type Business = {
  businessID: number;
  name: string;
  email?: string;
};

//payments
export type PaymentStatus = "pending" | "completed" | "refunded" | "cancelled";

export type Payment = {
  id: number;
  amount: number;
  date: string;
  paymentMethod: string;
  appointmentId: number;
  customerId: number;
  businessId?: number;
  status: PaymentStatus;
  notes?: string;
  customerName?: string;
};