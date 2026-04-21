import { format, formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';

export const formatDate = (date) => format(new Date(date), 'dd MMM yyyy, hh:mm a');

export const formatTime = (date) => format(new Date(date), 'hh:mm a');

export const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatDuration = (hours) => {
  if (!hours && hours !== 0) return '--';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const getLiveDuration = (entryTime) => {
  const diffMin = differenceInMinutes(new Date(), new Date(entryTime));
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

export const getLiveDurationHours = (entryTime) => {
  return Math.max(0, differenceInMinutes(new Date(), new Date(entryTime)) / 60);
};

export const calculateCharges = (entryTime, pricing) => {
  const durationHours = getLiveDurationHours(entryTime);
  const { baseDurationHours, basePrice, extraHourPrice } = pricing;
  let extraAmount = 0;
  if (durationHours > baseDurationHours) {
    const extraHours = Math.ceil(durationHours - baseDurationHours);
    extraAmount = extraHours * extraHourPrice;
  }
  return {
    durationHours: parseFloat(durationHours.toFixed(2)),
    baseAmount: basePrice,
    extraAmount,
    totalAmount: basePrice + extraAmount,
  };
};

export const getSlotStatusColor = (status) => {
  switch (status) {
    case 'available': return 'emerald';
    case 'occupied': return 'red';
    case 'reserved': return 'amber';
    case 'maintenance': return 'gray';
    default: return 'gray';
  }
};

export const vehicleTypeIcon = (type) => {
  switch (type) {
    case 'car': return '🚗';
    case 'bike': return '🏍️';
    case 'truck': return '🚛';
    case 'bus': return '🚌';
    default: return '🚗';
  }
};
