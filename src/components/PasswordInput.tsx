import { useState } from "react";
import { IconEye, IconEyeOff } from "./Icons";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function PasswordInput({ value, onChange, placeholder = "Senha", autoFocus }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input">
      <input
        type={show ? "text" : "password"}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <IconEyeOff width={20} height={20} /> : <IconEye width={20} height={20} />}
      </button>
    </div>
  );
}
