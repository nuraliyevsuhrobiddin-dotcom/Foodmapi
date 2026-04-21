export const formatDistance = (distanceInMeters) => {
  const distance = Number(distanceInMeters || 0);

  if (distance <= 0) return '0 m';
  if (distance < 1000) return `${Math.round(distance)} m`;

  const wholeKm = Math.floor(distance / 1000);
  const remainingMeters = Math.round(distance % 1000);

  if (distance < 10000) {
    const kmValue = Math.floor((distance / 1000) * 10) / 10;
    return `${kmValue.toFixed(1)} km`;
  }

  if (remainingMeters === 0) {
    return `${wholeKm} km`;
  }

  return `${wholeKm} km ${remainingMeters} m`;
};

export const formatDuration = (durationInSeconds) => {
  const duration = Number(durationInSeconds || 0);

  if (duration <= 0) return '1 daqiqa';

  const totalMinutes = Math.max(Math.round(duration / 60), 1);

  if (totalMinutes < 60) {
    return `${totalMinutes} daqiqa`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} soat`;
  }

  return `${hours} soat ${minutes} daqiqa`;
};
