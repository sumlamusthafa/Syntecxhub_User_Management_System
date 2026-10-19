function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = "md", tone = "amber" }) {
  return (
    <span className={`avatar avatar-${size} avatar-${tone}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
