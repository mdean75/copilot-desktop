import { useModelStore } from "../../store/useModelStore";

interface Props {
  value: string;
  onChange: (modelId: string) => void;
}

export function ModelPicker({ value, onChange }: Props) {
  const { models, isLoading, error } = useModelStore();

  if (isLoading) {
    return (
      <select
        disabled
        className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm text-[hsl(var(--foreground))] opacity-50"
      >
        <option>Loading models...</option>
      </select>
    );
  }

  if (error) {
    return (
      <span className="text-xs text-red-500" title={error}>
        Models error (hover)
      </span>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name || m.id}
        </option>
      ))}
      {models.length === 0 && (
        <option value={value}>{value}</option>
      )}
    </select>
  );
}
