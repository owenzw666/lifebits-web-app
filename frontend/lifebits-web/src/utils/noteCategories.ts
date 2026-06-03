export type NoteCategory = "Life" | "Work" | "Travel" | "Other";

interface NoteCategoryOption {
  value: NoteCategory;
  label: string;
  color: string;
  background: string;
  border: string;
}

export const defaultNoteCategory: NoteCategory = "Life";

export const noteCategoryOptions: NoteCategoryOption[] = [
  {
    value: "Life",
    label: "Life",
    color: "#166534",
    background: "#f0fdf4",
    border: "#bbf7d0",
  },
  {
    value: "Work",
    label: "Work",
    color: "#1d4ed8",
    background: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    value: "Travel",
    label: "Travel",
    color: "#92400e",
    background: "#fffbeb",
    border: "#fde68a",
  },
  {
    value: "Other",
    label: "Other",
    color: "#6b21a8",
    background: "#faf5ff",
    border: "#e9d5ff",
  },
];

export const getNoteCategoryOption = (category?: string | null) => {
  // Unknown values fall back to Life so old or unexpected data still renders safely.
  return (
    noteCategoryOptions.find((option) => option.value === category) ??
    noteCategoryOptions[0]
  );
};
