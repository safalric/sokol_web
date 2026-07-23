type SokolLogoProps = {
  compact?: boolean;
};

export function SokolLogo({ compact = false }: SokolLogoProps) {
  return (
    <img
      className={compact ? "sokol-logo sokol-logo-compact" : "sokol-logo"}
      src="/brand/sokol-symbol-rgb.png"
      alt=""
      aria-hidden="true"
    />
  );
}
