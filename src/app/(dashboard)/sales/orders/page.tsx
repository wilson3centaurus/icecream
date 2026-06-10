'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, Plus } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';

const orders = [
  { id: 'SO-0021', customer: 'Eastgate Supermart', branch: 'Main', items: 4, total: '$860.00', status: 'INVOICED', date: '07 Jun 2026' },
  { id: 'SO-0020', customer: 'Sunshine Café', branch: 'Eastlea', items: 2, total: '$240.00', status: 'DELIVERED', date: '07 Jun 2026' },
  { id: 'SO-0019', customer: 'Borrowdale Fresh', branch: 'Main', items: 6, total: '$1,420.00', status: 'PICKING', date: '06 Jun 2026' },
  { id: 'SO-0018', customer: 'Avondale School', branch: 'Avondale', items: 3, total: '$390.00', status: 'PAID', date: '06 Jun 2026' },
  { id: 'SO-0017', customer: 'Harare Hotels Ltd', branch: 'Main', items: 8, total: '$2,100.00', status: 'CONFIRMED', date: '05 Jun 2026' },
  { id: 'SO-0016', customer: 'City Retail Chain', branch: 'Eastlea', items: 10, total: '$3,200.00', status: 'PAID', date: '05 Jun 2026' },
  { id: 'SO-0015', customer: 'Chisipite Mall', branch: 'Main', items: 5, total: '$1,050.00', status: 'CANCELLED', date: '04 Jun 2026' },
];

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-muted dark:bg-white/8 dark:text-white/40',
  CONFIRMED: 'bg-blue-500/15 text-blue-400',
  PICKING: 'bg-amber-500/15 text-amber-400',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400',
  INVOICED: 'bg-violet-500/15 text-violet-400',
  PAID: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

export default function SalesOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Orders"
        description="Create, track and manage all customer orders across branches."
        actions={
          <div className="flex items-center gap-3">
            <Link href="/sales" className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-muted transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <button className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-deepOrange">
              <Plus className="h-4 w-4" />
              New Order
            </button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {['All', 'CONFIRMED', 'PICKING', 'DELIVERED', 'INVOICED', 'PAID'].map((f) => (
          <button key={f} className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${f === 'All' ? 'bg-orange text-white' : 'border border-border bg-white text-muted hover:bg-gray-50 hover:text-brown dark:border-white/8 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white dark:border-white/8 dark:bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-white/8">
              <th className="px-5 py-3.5 text-left text-xs font-medium text-muted dark:text-white/40">Order #</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-muted dark:text-white/40">Customer</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-muted dark:text-white/40">Branch</th>
              <th className="px-5 py-3.5 text-right text-xs font-medium text-muted dark:text-white/40">Items</th>
              <th className="px-5 py-3.5 text-right text-xs font-medium text-muted dark:text-white/40">Total</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-muted dark:text-white/40">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-medium text-muted dark:text-white/40">Date</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border transition hover:bg-gray-50 last:border-0 dark:border-white/5 dark:hover:bg-white/4">
                <td className="px-5 py-3.5 font-mono text-xs text-orange">{order.id}</td>
                <td className="px-5 py-3.5 font-medium text-brown dark:text-white">{order.customer}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{order.branch}</td>
                <td className="px-5 py-3.5 text-right text-brown dark:text-white/70">{order.items}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-brown dark:text-white">{order.total}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-muted dark:text-white/40">{order.date}</td>
                <td className="px-5 py-3.5 text-right">
                  <button className="rounded-lg p-1.5 text-muted/70 transition hover:bg-gray-100 hover:text-brown dark:text-white/30 dark:hover:bg-white/8 dark:hover:text-white">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
