import BookingsClient from "./BookingsClient";
import { getAppointments } from "@/lib/api";

export default async function BookingsPage() {
  // Note: In server component, we cannot directly use client-side filtering functions
  // So we load all bookings and pass them to client component which handles filtering
  const bookings = await getAppointments();

  return <BookingsClient initialBookings={bookings} />;
}