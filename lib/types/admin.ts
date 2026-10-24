import { Booking } from "./booking";

export interface AdminMetrics {
  total_revenue_cents: number;
  total_bookings_count: number;
  confirmed_bookings_count: number;
  active_guests_count: number;
  occupancy_rate_percent: number;
  average_daily_rate_cents: number;
  revenue_growth_percent: number;
}

export interface MonthlyRevenueData {
  month: string;
  revenue_dollars: number;
  bookings_count: number;
}

export interface OccupancyTrendData {
  date: string;
  occupancy_rate: number;
  available_rooms: number;
}

export interface AdminDashboardData {
  metrics: AdminMetrics;
  revenue_chart: MonthlyRevenueData[];
  occupancy_chart: OccupancyTrendData[];
  recent_bookings: Booking[];
}

export interface BlockedDateRange {
  id: string;
  room_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}
