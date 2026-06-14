import { NavLink } from "react-router-dom";
import { IconHome, IconDumbbell, IconHistory, IconChart } from "./Icons";

const items = [
  { to: "/app", label: "Início", icon: IconHome, end: true },
  { to: "/app/workouts", label: "Treinos", icon: IconDumbbell, end: false },
  { to: "/app/history", label: "Histórico", icon: IconHistory, end: false },
  { to: "/app/stats", label: "Stats", icon: IconChart, end: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => "bottom-nav__item" + (isActive ? " is-active" : "")}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
