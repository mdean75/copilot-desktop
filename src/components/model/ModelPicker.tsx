import { MODELS } from "../../types/settings";

interface Props {
  value: string;
  onChange: (modelId: string) => void;
}

export function ModelPicker({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
    >
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
