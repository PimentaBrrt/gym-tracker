import { useNavigate } from "react-router-dom";
import { IconBack } from "./Icons";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

export default function Header({ title, subtitle, back, right }: Props) {
  const nav = useNavigate();
  return (
    <header className="app-header">
      <div className="row" style={{ gap: 12, minWidth: 0 }}>
        {back && (
          <button className="btn btn--icon btn--ghost" onClick={() => nav(-1)} aria-label="Voltar">
            <IconBack />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          {subtitle && <div className="eyebrow">{subtitle}</div>}
          <h1 className="app-header__title">{title}</h1>
        </div>
      </div>
      {right && <div className="row">{right}</div>}
    </header>
  );
}
