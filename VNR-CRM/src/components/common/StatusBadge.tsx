import React from 'react';

type StatusType =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'pending_documents'
  | 'pending_review'
  | 'active'
  | 'suspended'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'online'
  | 'offline'
  | 'busy';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // General
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Aceptado', className: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'En progreso', className: 'bg-indigo-100 text-indigo-800' },
  completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },

  // Driver status
  pending_documents: { label: 'Pendiente docs', className: 'bg-yellow-100 text-yellow-800' },
  pending_review: { label: 'En revisión', className: 'bg-blue-100 text-blue-800' },
  active: { label: 'Activo', className: 'bg-green-100 text-green-800' },
  suspended: { label: 'Suspendido', className: 'bg-orange-100 text-orange-800' },

  // Delivery status
  picked_up: { label: 'Recogido', className: 'bg-blue-100 text-blue-800' },
  in_transit: { label: 'En tránsito', className: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800' },

  // Availability
  online: { label: 'En línea', className: 'bg-green-100 text-green-800' },
  offline: { label: 'Desconectado', className: 'bg-gray-100 text-gray-800' },
  busy: { label: 'Ocupado', className: 'bg-orange-100 text-orange-800' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.className} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
