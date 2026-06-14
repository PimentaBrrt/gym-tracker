interface Props { name: string; hue?: number; size?: number; }

export default function Avatar({ name, hue = 220, size = 56 }: Props) {
  const initials = name.trim().slice(0, 2).toUpperCase();
  const bg = `linear-gradient(150deg, hsl(${hue} 70% 58%), hsl(${(hue + 28) % 360} 65% 42%))`;
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
