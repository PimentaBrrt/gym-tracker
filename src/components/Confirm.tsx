import Modal from "./Modal";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function Confirm({ open, title, message, confirmLabel = "Excluir", onConfirm, onClose }: Props) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-2" style={{ marginBottom: 18 }}>{message}</p>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn--danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
