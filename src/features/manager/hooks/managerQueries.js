import { useQuery } from '@tanstack/react-query';
import {
  getApprovals,
  getUserRegistrations,
  getDashboardStats,
  getLoyaltyStats,
} from '../services/managerService';
import { poService } from '@/features/procurement/services/poService';

/**
 * Canonical, cached, deduped queries for manager server-state. Multiple components that need the
 * same data (e.g. sidebar badge + dashboard KPI both need pending approvals) share one request and
 * one background poll instead of each fetching independently.
 */

function toList(res) {
  const raw = res?.data?.data || res?.data || res || [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.content)) return raw.content;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.data?.content)) return raw.data.content;
  return [];
}

export function useApprovals(status = 'PENDING', options = {}) {
  return useQuery({
    // status null/undefined means "all" (the backend treats a missing status as all).
    queryKey: ['manager', 'approvals', status || 'ALL'],
    queryFn: () => getApprovals(status || null),
    select: (data) => (Array.isArray(data) ? data : []),
    ...options,
  });
}

export function usePendingUserRegistrations(options = {}) {
  return useQuery({
    queryKey: ['manager', 'userRegistrations', 'PENDING'],
    queryFn: () => getUserRegistrations('PENDING'),
    select: (data) => (Array.isArray(data) ? data : []),
    ...options,
  });
}

export function usePendingPOs(options = {}) {
  return useQuery({
    queryKey: ['procurement', 'pendingPOs'],
    queryFn: () => poService.getPendingPOs(),
    select: toList,
    ...options,
  });
}

export function useDashboardStats(options = {}) {
  return useQuery({
    queryKey: ['manager', 'dashboardStats'],
    queryFn: getDashboardStats,
    select: (data) => (Array.isArray(data) ? data : [data]),
    ...options,
  });
}

export function useLoyaltyStats(options = {}) {
  return useQuery({
    queryKey: ['manager', 'loyaltyStats'],
    queryFn: () => getLoyaltyStats().catch(() => ({ totalCustomers: 0, totalPoints: 0 })),
    ...options,
  });
}
