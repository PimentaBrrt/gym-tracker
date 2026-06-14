import { useEffect, useState } from "react";
import { IconShare, IconDots, IconClose } from "./Icons";

const KEY = "gymtrack-install-hint-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

interface Props {
  /** Quando nao ha a barra de navegacao (ex.: tela de perfis), ancora mais embaixo. */
  hasNav?: boolean;
}

export default function InstallHint({ hasNav = true }: Props) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(KEY) === "1");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(isStandalone());

  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isIOSSafari = isIOS && !/crios|fxios|edgios/i.test(ua);
  const isAndroid = /android/i.test(ua);

  useEffect(() => {
    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setStandalone(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || dismissed) return null;
  if (!isIOSSafari && !isAndroid) return null; // so faz sentido em celular

  const close = () => { localStorage.setItem(KEY, "1"); setDismissed(true); };
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
    close();
  };

  return (
    <div
      className="install-hint"
      style={hasNav ? undefined : { bottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <span className="install-hint__icon">{isIOSSafari ? <IconShare /> : <IconDots />}</span>
      <div className="install-hint__body">
        <strong>Instale o Gym Tracker</strong>
        {isIOSSafari ? (
          <p>Toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</p>
        ) : deferred ? (
          <p>Tenha o app na tela inicial do seu celular.</p>
        ) : (
          <p>Toque no menu <b>⋮</b> e em <b>Instalar app</b> / <b>Adicionar à tela inicial</b>.</p>
        )}
      </div>
      {isAndroid && deferred && (
        <button className="btn btn--primary btn--sm" onClick={install}>Instalar</button>
      )}
      <button className="btn btn--icon btn--ghost btn--sm" onClick={close} aria-label="Fechar"><IconClose width={18} height={18} /></button>
    </div>
  );
}
