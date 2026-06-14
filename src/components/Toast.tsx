import { useToast } from "@/store/toastStore";
export default function Toast() {
  const message = useToast((s) => s.message);
  if (!message) return null;
  return <div className="toast">{message}</div>;
}
