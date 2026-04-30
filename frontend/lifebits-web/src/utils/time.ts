// 后端 → 输入控件（datetime-local）
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
};

// 输入控件 → 后端（ISO UTC）
export const toISO = (local: string) => {
  return new Date(local).toISOString();
};

// 后端 → UI展示（统一格式）
export const formatDisplayTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};