import { createContext, useContext } from "react";

export const LumaContext = createContext(null);

export function useLuma() {
  const value = useContext(LumaContext);
  if (!value) throw new Error("useLuma must be used inside the app");
  return value;
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button className={`btn ${variant} ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="stack" style={{ gap: 0 }}>
      {label ? <span className="label">{label}</span> : null}
      {children}
    </label>
  );
}

export function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="spread" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
