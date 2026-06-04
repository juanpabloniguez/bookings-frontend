export type BookingStatus = "pending" | "confirmed" | "paid";

export interface Booking {
  id: number;
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
  customerName?: string;
  businessName?: string;
}

export interface CreateBookingDto {
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
  customerName?: string;
  businessName?: string;
}

export interface UpdateBookingDto {
  date?: string;
  time?: string;
  status?: BookingStatus;
  customerId?: number;
  businessId?: number;
  serviceName?: string;
  customerName?: string;
  businessName?: string;
}

import { getCurrentUser, isAdminUser } from './currentUser';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getPaymentsScopeHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return {};
  }

  const user = getCurrentUser();
  if (!user) {
    return {};
  }

  const isAdmin = isAdminUser(user);
  const headers: Record<string, string> = {
    'x-user-role': isAdmin ? 'admin' : (user.role ?? 'user'),
  };

  if (!isAdmin && typeof user.businessId === 'number') {
    headers['x-business-id'] = String(user.businessId);
  }

  return headers;
}

export async function getAppointments(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/appointments`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener las reservas");
  }

  return res.json();
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al crear la reserva");
  }

  return res.json();
}

export async function updateAppointment(
  id: number,
  data: UpdateBookingDto
): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al editar la reserva");
  }

  return res.json();
}

export async function deleteAppointment(
  id: number
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Error al eliminar la reserva");
  }

  return res.json();
}


//customers
import type { Customer } from './types';

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email: string;
  businessId: number;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  businessId?: number;
}

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_URL}/customers`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener los clientes');
  return res.json();
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear el cliente');
  return res.json();
}

export async function updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al editar el cliente');
  return res.json();
}

export async function deleteCustomer(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar el cliente');
  return res.json();
}

//businesses
import type { Business } from './types';

export interface CreateBusinessDto {
  name: string;
}

export interface UpdateBusinessDto {
  name?: string;
}

export async function getBusinesses(): Promise<Business[]> {
  const res = await fetch(`${API_URL}/businesses`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener los negocios');
  return res.json();
}

export async function createBusiness(data: CreateBusinessDto): Promise<Business> {
  const res = await fetch(`${API_URL}/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear el negocio');
  return res.json();
}

export async function updateBusiness(id: number, data: UpdateBusinessDto): Promise<Business> {
  const res = await fetch(`${API_URL}/businesses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al editar el negocio');
  return res.json();
}

export async function deleteBusiness(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/businesses/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar el negocio');
  return { message: 'Negocio eliminado correctamente' };
}

//payments
import type { Payment, PaymentStatus } from './types';

export interface CreatePaymentDto {
  amount: number;
  date: string;
  paymentMethod: string;
  appointmentId?: number;
  customerId?: number;
  businessId: number;
  status: PaymentStatus;
  notes?: string;
  customerName?: string;
}

export async function getPayments(): Promise<Payment[]> {
  const res = await fetch(`${API_URL}/payments`, {
    cache: 'no-store',
    headers: getPaymentsScopeHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener los pagos');
  return res.json();
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getPaymentsScopeHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al registrar el pago');
  return res.json();
}

export async function deletePayment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: 'DELETE',
    headers: getPaymentsScopeHeaders(),
  });
  if (!res.ok) throw new Error('Error al eliminar el pago');
  return res.json();
}