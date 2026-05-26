import { format } from "date-fns";

export const toLocalInput = (dateStr: string) => {
  return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");
};

export const toISO = (localDateTime: string) => {
  // datetime-local already represents the user's local wall-clock time.
  // Keep that same clock time when sending it to the API, instead of converting
  // to UTC with Date.toISOString(). SQLite/EF may return DateTime values without
  // a timezone suffix, and converting here can cause a 12-hour display shift in NZ.
  return localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
};

export const formatDisplayTime = (dateStr: string) => {
  return format(new Date(dateStr), "yyyy-MM-dd HH:mm");
};
