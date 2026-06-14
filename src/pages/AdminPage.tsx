import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { useSetSetting } from "@/hooks/useSettings";
import { sha256 } from "@/lib/crypto";
import { useToast } from "@/store/toastStore";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import Confirm from "@/components/Confirm";
import PasswordInput from "@/components/PasswordInput";
import { IconShield, IconUsers, IconKey, IconEdit, IconTrash, IconPlus, IconChevron } from "@/components/Icons";
import type { User } from "@/types";

const HUES = [220, 260, 160, 30, 340, 195];

export default function AdminPage() {
  const nav = useNavigate();
  const { adminElevated, selectUser } = useAuthStore();
  const { data: users } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const setSetting = useSetSetting();
  const toast = useToast((s) => s.show);

  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [hue, setHue] = useState(HUES[0]);

  // Troca de senhas
  const [famPw, setFamPw] = useState(""); const [famPw2, setFamPw2] = useState("");
  const [admPw, setAdmPw] = useState(""); const [admPw2, setAdmPw2] = useState("");

  if (!adminElevated) {
    return (
      <div className="page">
        <Header title="Administração" back />
        <div className="empty"><p>Acesso restrito ao administrador.</p></div>
      </div>
    );
  }

  // Ver/editar dados de um usuário (entra como ele, mantendo modo admin).
  const viewAs = (u: User) => { selectUser(u.id, true); nav("/app", { replace: true }); toast(`Vendo dados de ${u.name}`); };

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      await updateUser.mutateAsync({ id: editing.id, name: name.trim(), avatar_hue: hue });
      setEditing(null); toast("Usuário atualizado");
    } else {
      await createUser.mutateAsync({ name: name.trim(), avatar_hue: hue });
      setCreating(false); toast("Usuário criado");
    }
  };

  const changePassword = async (key: string, a: string, b: string, reset: () => void, label: string) => {
    if (a.length < 4) { toast("Senha muito curta"); return; }
    if (a !== b) { toast("As senhas não coincidem"); return; }
    await setSetting.mutateAsync({ key, value: await sha256(a) });
    reset(); toast(`${label} alterada`);
  };

  return (
    <div className="page">
      <Header title="Administração" subtitle="Painel do admin" back />

      <div className="admin-banner">
        <span style={{ color: "var(--blue-2)" }}><IconShield /></span>
        <span className="text-2" style={{ fontSize: 14 }}>
          Como admin você pode ver e editar os dados de qualquer perfil e alterar as senhas.
        </span>
      </div>

      <div className="section-title"><h2><span className="row" style={{ gap: 8 }}><IconUsers width={18} height={18} /> Usuários</span></h2>
        <button className="btn btn--ghost btn--sm" onClick={() => { setCreating(true); setEditing(null); setName(""); setHue(HUES[0]); }}>
          <IconPlus width={16} height={16} /> Novo
        </button>
      </div>

      <div className="list">
        {users?.map((u) => (
          <div key={u.id} className="admin-user-row">
            <Avatar name={u.name} hue={u.avatar_hue} size={42} />
            <div className="admin-user-row__body">
              <div className="admin-user-row__name">{u.name}{u.is_admin ? " · admin" : ""}</div>
              <div className="admin-user-row__meta">criado em {new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => viewAs(u)}>Ver dados <IconChevron width={14} height={14} /></button>
            {!u.is_admin && (
              <>
                <button className="btn btn--icon btn--ghost btn--sm" onClick={() => { setEditing(u); setName(u.name); setHue(u.avatar_hue); setCreating(false); }}><IconEdit width={16} height={16} /></button>
                <button className="btn btn--icon btn--danger btn--sm" onClick={() => setDeleting(u)}><IconTrash width={16} height={16} /></button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="section-title"><h2><span className="row" style={{ gap: 8 }}><IconKey width={18} height={18} /> Senhas</span></h2></div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Senha da aplicação (tela inicial)</div>
        <div className="field"><label>Nova senha</label><PasswordInput value={famPw} onChange={setFamPw} placeholder="Nova senha da aplicação" /></div>
        <div className="field"><label>Confirmar</label><PasswordInput value={famPw2} onChange={setFamPw2} placeholder="Repita a senha" /></div>
        <button className="btn btn--primary btn--block" disabled={setSetting.isPending || !famPw}
          onClick={() => changePassword("family_password_hash", famPw, famPw2, () => { setFamPw(""); setFamPw2(""); }, "Senha da aplicação")}>
          Alterar senha da aplicação
        </button>
      </div>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Senha do administrador</div>
        <div className="field"><label>Nova senha</label><PasswordInput value={admPw} onChange={setAdmPw} placeholder="Nova senha de admin" /></div>
        <div className="field"><label>Confirmar</label><PasswordInput value={admPw2} onChange={setAdmPw2} placeholder="Repita a senha" /></div>
        <button className="btn btn--primary btn--block" disabled={setSetting.isPending || !admPw}
          onClick={() => changePassword("admin_password_hash", admPw, admPw2, () => { setAdmPw(""); setAdmPw2(""); }, "Senha de admin")}>
          Alterar senha de admin
        </button>
      </div>

      {/* Criar / editar usuário */}
      <Modal open={creating || !!editing} title={editing ? "Editar usuário" : "Novo usuário"} onClose={() => { setCreating(false); setEditing(null); }}>
        <form onSubmit={submitUser}>
          <div className="field"><label>Nome</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          </div>
          <div className="field"><label>Cor do avatar</label>
            <div className="row wrap" style={{ gap: 12 }}>
              <Avatar name={name || "?"} hue={hue} size={48} />
              {HUES.map((h) => (
                <button type="button" key={h} onClick={() => setHue(h)}
                  style={{ width: 34, height: 34, borderRadius: 10, cursor: "pointer",
                    border: hue === h ? "2px solid var(--text)" : "2px solid transparent",
                    background: `hsl(${h} 70% 55%)` }} aria-label={`cor ${h}`} />
              ))}
            </div>
          </div>
          <button className="btn btn--primary btn--block" disabled={createUser.isPending || updateUser.isPending}>
            {editing ? "Salvar" : "Criar"}
          </button>
        </form>
      </Modal>

      <Confirm
        open={!!deleting}
        title="Excluir usuário"
        message={`Excluir "${deleting?.name}" e todos os seus dados?`}
        onConfirm={async () => { if (deleting) { await deleteUser.mutateAsync(deleting.id); toast("Usuário excluído"); } }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
