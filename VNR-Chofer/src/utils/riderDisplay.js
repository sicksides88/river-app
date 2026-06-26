/** Helpers de presentación para pantallas patrón (River Service). */
export const getRiderDisplayName = (user) => {
  if (!user) return 'Patrón';
  if (user.nombre || user.apellido) {
    return [user.nombre, user.apellido].filter(Boolean).join(' ');
  }
  if (user.name) return user.name;
  if (user.first_name || user.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(' ');
  }
  return user.email?.split('@')[0] || 'Patrón';
};

export const getRiderInitials = (user) => {
  if (!user) return 'P';
  const first = user.nombre?.[0] || user.first_name?.[0] || user.name?.[0] || user.email?.[0] || 'P';
  const last = user.apellido?.[0] || user.last_name?.[0] || '';
  return `${first}${last}`.toUpperCase();
};

export const formatShiftRange = (startsAt, endsAt) => {
  if (!startsAt || !endsAt) return '—';
  const fmt = (iso) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(startsAt)} - ${fmt(endsAt)}`;
};

export const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export const countAuxiliosToday = (auxilios = []) =>
  auxilios.filter((a) => isToday(a.createdAt || a.updatedAt)).length;

export const estimateHoursToday = (auxilios = [], shift) => {
  const completed = auxilios.filter(
    (a) => isToday(a.updatedAt || a.createdAt) && ['finalizado', 'completed'].includes(a.status)
  );
  if (completed.length > 0) {
    const totalMin = completed.reduce((sum, a) => {
      const start = new Date(a.createdAt).getTime();
      const end = new Date(a.updatedAt || a.createdAt).getTime();
      return sum + Math.max(0, (end - start) / 60000);
    }, 0);
    return totalMin > 0 ? `${(totalMin / 60).toFixed(1)} h` : '0 h';
  }
  if (shift?.starts_at) {
    const elapsed = (Date.now() - new Date(shift.starts_at).getTime()) / 3600000;
    if (elapsed > 0 && elapsed < 24) return `${elapsed.toFixed(1)} h`;
  }
  return '0 h';
};
