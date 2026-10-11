export interface BackgroundColorOption {
  id: string;
  name: string;
  value: string;
  isSolid: boolean;
  gradient: string;
}

/** Simple base rainbow palette for surfaces that don't need the full linktree gradient set. */
export const RAINBOW_BACKGROUND_COLORS: BackgroundColorOption[] = [
  { id: "red", name: "Red", value: "#ef4444", isSolid: true, gradient: "" },
  {
    id: "orange",
    name: "Orange",
    value: "#f97316",
    isSolid: true,
    gradient: "",
  },
  {
    id: "yellow",
    name: "Yellow",
    value: "#eab308",
    isSolid: true,
    gradient: "",
  },
  { id: "green", name: "Green", value: "#22c55e", isSolid: true, gradient: "" },
  { id: "cyan", name: "Cyan", value: "#06b6d4", isSolid: true, gradient: "" },
  { id: "blue", name: "Blue", value: "#3b82f6", isSolid: true, gradient: "" },
  {
    id: "indigo",
    name: "Indigo",
    value: "#6366f1",
    isSolid: true,
    gradient: "",
  },
  {
    id: "violet",
    name: "Violet",
    value: "#8b5cf6",
    isSolid: true,
    gradient: "",
  },
  { id: "pink", name: "Pink", value: "#ec4899", isSolid: true, gradient: "" },
  { id: "black", name: "Black", value: "#0f172a", isSolid: true, gradient: "" },
  { id: "white", name: "White", value: "#ffffff", isSolid: true, gradient: "" },
];
