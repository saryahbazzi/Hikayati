"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

/** Shared control look: hairline box on paper, olive focus, generous height. */
export const controlCls =
  "block w-full border border-ink/25 bg-paper px-4 py-3 text-base text-ink placeholder:text-taupe transition-colors focus:border-olive focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-[#8a3b32]";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (a: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}

/** Label + control + hint + error, wired with aria. Pass a render function so the id reaches the control. */
export function Field({ label, hint, error, required, className = "", children }: FieldProps) {
  const id = useId();
  const desc = [hint ? `${id}-h` : "", error ? `${id}-e` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm text-ink">
        {label}
        {required && <span aria-hidden className="ms-1 text-olive">*</span>}
      </label>
      {children({ id, "aria-describedby": desc, "aria-invalid": error ? true : undefined })}
      {hint && !error && <p id={`${id}-h`} className="mt-1.5 text-xs leading-5 text-ink-soft">{hint}</p>}
      {error && <p id={`${id}-e`} role="alert" className="mt-1.5 text-xs leading-5 text-[#8a3b32]">{error}</p>}
    </div>
  );
}

export function TextInput({ label, hint, error, required, className, wrapperClassName, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; wrapperClassName?: string }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {(a) => <input {...a} required={required} className={`${controlCls} ${className ?? ""}`} {...rest} />}
    </Field>
  );
}

export function TextArea({ label, hint, error, required, className, wrapperClassName, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string; wrapperClassName?: string }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {(a) => <textarea {...a} required={required} rows={rest.rows ?? 3} className={`${controlCls} ${className ?? ""}`} {...rest} />}
    </Field>
  );
}

export function SelectInput({ label, hint, error, required, className, wrapperClassName, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; error?: string; wrapperClassName?: string }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {(a) => <select {...a} required={required} className={`${controlCls} ${className ?? ""}`} {...rest}>{children}</select>}
    </Field>
  );
}

export function Checkbox({ label, checked, onChange, error, hint, name }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; error?: string; hint?: string; name?: string }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-start gap-3">
        <input id={id} name={name} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={error ? true : undefined} className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-olive)]" />
        <label htmlFor={id} className="text-sm leading-6 text-ink">{label}</label>
      </div>
      {hint && !error && <p className="ms-7 mt-1 text-xs text-ink-soft">{hint}</p>}
      {error && <p role="alert" className="ms-7 mt-1 text-xs text-[#8a3b32]">{error}</p>}
    </div>
  );
}

/** Choice cards (single select), keyboard accessible via native radios. */
export function RadioCards<T extends string>({ legend, value, onChange, options, columns = 3, error }: { legend: string; value: T | ""; onChange: (v: T) => void; options: { value: T; label: string; sub?: string }[]; columns?: 2 | 3 | 4; error?: string }) {
  const name = useId();
  const cols = columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={`grid gap-3 ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className={`relative block cursor-pointer border px-5 py-4 transition-colors ${value === o.value ? "border-olive bg-paper shadow-[inset_0_0_0_1px_var(--color-olive)]" : "border-ink/20 hover:border-olive/60"}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className="block text-base text-ink">{o.label}</span>
            {o.sub && <span className="mt-1 block text-xs text-ink-soft">{o.sub}</span>}
            <span aria-hidden className="pointer-events-none absolute inset-0 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive" />
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-[#8a3b32]">{error}</p>}
    </fieldset>
  );
}
