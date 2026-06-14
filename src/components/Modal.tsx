import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "./Icons";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, title, onClose, children }: Props) {
  // Marca se o gesto COMECOU no proprio backdrop. Assim, arrastar uma selecao
  // de dentro de um input e soltar fora nao fecha o modal por engano.
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onPointerDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }}
      onPointerUp={(e) => {
        // Fecha so se o gesto comecou E terminou no fundo (clique explicito fora).
        if (downOnBackdrop.current && e.target === e.currentTarget) onClose();
        downOnBackdrop.current = false;
      }}
    >
      <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Fechar">
            <IconClose />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
