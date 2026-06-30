type AperoOrnamentsProps = {
  variant?: "counter" | "registry" | "verdict" | "share";
};

export function AperoOrnaments({ variant = "counter" }: AperoOrnamentsProps) {
  return (
    <aside className={`apero-ornaments apero-ornaments--${variant}`} aria-hidden="true">
      <span className="apero-object apero-object--bowl">
        <span />
        <span />
        <span />
      </span>
      <span className="apero-object apero-object--glass" />
      <span className="apero-object apero-object--ticket">
        <i />
        <i />
        <i />
      </span>
      <span className="apero-object apero-object--sign" />
    </aside>
  );
}
