interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange(value: number): void;
}

/** Labelled range slider with a matching number box. */
export function SliderRow({ label, value, min, max, step, onChange }: Props) {
  const shown = +value.toFixed(1);
  return (
    <div className="slider-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={shown}
        onChange={(e) => e.target.value !== '' && isFinite(+e.target.value) && onChange(+e.target.value)}
      />
    </div>
  );
}
