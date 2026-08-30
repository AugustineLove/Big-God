import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export const formatCurrency = (amount: number | string | undefined | null) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(Math.abs(Number(amount) || 0));
};

// A shorter form for large headline numbers on the header, e.g. "GHS 12,450"
// without decimals — decimals read as noise at display size.
export const formatCurrencyCompact = (amount: number | string | undefined | null) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

export const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Invalid date';
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? 'Invalid date'
    : date.toLocaleDateString('en-GH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

export const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'deposit':
      return <ArrowDownLeft className="w-4 h-4" />;
    case 'transfer_in':
      return <ArrowDownLeft className="w-4 h-4" />;
    case 'withdrawal':
      return <ArrowUpRight className="w-4 h-4" />;
    case 'payment':
      return <ArrowUpRight className="w-4 h-4" />;
    default:
      return <ArrowUpRight className="w-4 h-4" />;
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'failed':
      return <XCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};