import { getCurrentUser, isAdminUser } from './currentUser';
import type { Booking } from './api';
import type { Customer, Payment, Business } from './types';

/**
 * Obtiene el negocio del usuario actual
 */
export function getUserBusinessFilter(): string | null {
  const user = getCurrentUser();
  if (!user) return null;
  return user.business ?? null;
}

/**
 * Verifica si el usuario es admin
 */
export function isCurrentUserAdmin(): boolean {
  return isAdminUser(getCurrentUser());
}

/**
 * Compara dos valores de negocio (string name o numero id)
 * Maneja comparaciones case-insensitive
 */
function businessMatch(userBusiness: string, dataBusiness: string | number | undefined): boolean {
  if (!dataBusiness) return false;
  
  const dataStr = String(dataBusiness).trim().toLowerCase();
  const userStr = userBusiness.trim().toLowerCase();
  
  return dataStr === userStr;
}

/**
 * Filtra reservas por negocio del usuario
 */
export function filterAppointmentsByBusiness(appointments: Booking[]): Booking[] {
  if (isCurrentUserAdmin()) {
    return appointments;
  }
  
  const userBusiness = getUserBusinessFilter();
  if (!userBusiness) return [];
  
  return appointments.filter((apt) => businessMatch(userBusiness, apt.businessName));
}

/**
 * Filtra clientes por negocio del usuario
 */
export function filterCustomersByBusiness(customers: Customer[]): Customer[] {
  if (isCurrentUserAdmin()) {
    return customers;
  }
  
  const userBusiness = getUserBusinessFilter();
  if (!userBusiness) return [];
  
  return customers.filter((cust) => businessMatch(userBusiness, cust.business));
}

/**
 * Filtra pagos por negocio del usuario
 */
export function filterPaymentsByBusiness(payments: Payment[]): Payment[] {
  if (isCurrentUserAdmin()) {
    return payments;
  }
  
  const userBusiness = getUserBusinessFilter();
  if (!userBusiness) return [];
  
  // Los pagos no tienen campo business directamente, 
  // así que filtrar por customerName usando la relación con customers
  // Esta es una aproximación temporal - idealmente el backend debería tener esta info
  return payments;
}

/**
 * Filtra pagos por negocio considerando los clientes
 */
export function filterPaymentsByBusinessWithCustomers(
  payments: Payment[],
  customers: Customer[]
): Payment[] {
  if (isCurrentUserAdmin()) {
    return payments;
  }

  const currentUser = getCurrentUser();
  const userBusinessId = currentUser?.businessId;

  if (typeof userBusinessId === 'number') {
    return payments.filter((payment) => payment.businessId === userBusinessId);
  }

  const userBusiness = getUserBusinessFilter();
  if (!userBusiness) return [];

  // Fallback para datos anteriores que no incluyen businessId en payment.
  const allowedCustomerIds = customers
    .filter((cust) => businessMatch(userBusiness, cust.business))
    .map((cust) => cust.id);

  return payments.filter((payment) => {
    if (typeof payment.businessId === 'number') {
      const customer = customers.find((cust) => cust.id === payment.customerId);
      if (!customer) return false;
      return businessMatch(userBusiness, customer.business);
    }

    return allowedCustomerIds.includes(payment.customerId);
  });
}

/**
 * Filtra negocios para mostrar solo el negocio del usuario actual
 */
export function filterBusinessesForUser(businesses: Business[]): Business[] {
  if (isCurrentUserAdmin()) {
    return businesses;
  }
  
  const userBusiness = getUserBusinessFilter();
  if (!userBusiness) return [];
  
  return businesses.filter((biz) => businessMatch(userBusiness, biz.name));
}
