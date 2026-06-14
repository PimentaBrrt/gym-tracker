import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { matchesHash, ADMIN_PASSWORD_HASH } from "@/lib/crypto";
import { useToast } from "@/store/toastStore";
import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import Confirm from "@/components/Confirm";
import { IconPlus, IconEdit, IconTrash, IconLock } from "@/components/Icons";
import type { User } from "@/types";

const HUES = [220, 260, 160, 30, 340, 195];

export default function ProfilesPage() {
  const nav = useNavigate();
  const selectUser = useAuthStore((s) => s.selectUser);
  const lockGate = useAuthStore((s) => s.lockGate);
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toast = useToast((s) => s.show);

  const [manage, setManage] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [adminFor, setAdminFor] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [hue, setHue] = useState(HUES[0]);
  const [adminPw, setAdminPw] = useState("");
  const [adminErr, setAdminErr] = useState("");

  const pick = (u: User) => {
    if (manage) return;
    if (u.is_admin) { setAdminFor(u); setAdminPw(""); setAdminErr(""); return; }
    selectUser(u.id);
    nav("/app", { replace: true });
  };

  const confirmAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await matchesHash(adminPw, ADMIN_PASSWORD_HASH)) {
      selectUser(adminFor!.id, true);
      nav("/app", { replace: true });
    } else {
      setAdminErr("Senha de admin incorreta.");
      setAdminPw("");
    }
  };

  const openCreate = () => { setName(""); setHue(HUES[Math.floor(Math.random() * HUES.length)]); setShowCreate(true); };
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createUser.mutateAsync({ name: name.trim(), avatar_hue: hue });
    setShowCreate(false); toast("Perfil criado");
  };
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !name.trim()) return;
    await updateUser.mutateAsync({ id: editing.id, name: name.trim(), avatar_hue: hue });
    setEditing(null); toast("Perfil atualizado");
  };

  return (
    <div className="profiles">
      <div className="eyebrow">Family Gym Tracker</div>
      <h1>Quem vai treinar?</h1>

      {isLoading ? (
        <p className="muted" style={{ marginTop: 24 }}>Carregando perfis...</p>
      ) : (
        <div className="profiles__grid">
          {users?.map((u) => (
            <div key={u.id} className={"profile" + (u.is_admin ? " is-admin" : "")} style={{ position: "relative" }}>
              <button className="profile" onClick={() => pick(u)} style={{ width: "100%" }}>
                <div style={{ position: "relative" }}>
                  <Avatar name={u.name} hue={u.avatar_hue} size={92} />
                  {u.is_admin && (
                    <span style={{ position: "absolute", right: -2, bottom: -2, background: "var(--bg)", borderRadius: 8, padding: 4 }}>
                      <IconLock width={16} height={16} />
                    </span>
                  )}
                </div>
                <span className="profile__name">{u.name}</span>
              </button>
              {manage && !u.is_admin && (
                <div className="row" style={{ justifyContent: "center", gap: 6 }}>
                  <button className="btn btn--icon btn--ghost btn--sm" onClick={() => { setEditing(u); setName(u.name); setHue(u.avatar_hue); }}>
                    <IconEdit width={15} height={15} />
                  </button>
                  <button className="btn btn--icon btn--danger btn--sm" onClick={() => setDeleting(u)}>
                    <IconTrash width={15} height={15} />
                  </button>
                </div>
              )}
            </div>
          ))}

          <button className="profile profile--add" onClick={openCreate}>
            <div className="avatar" style={{ width: 92, height: 92, fontSize: 30 }}><IconPlus /></div>
            <span className="profile__name">Novo perfil</span>
          </button>
        </div>
      )}

      <div className="row" style={{ marginTop: 34, gap: 10 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => setManage((v) => !v)}>
          {manage ? "Concluir" : "Gerenciar perfis"}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => { lockGate(); nav("/", { replace: true }); }}>
          Sair
        </button>
      </div>

      {/* Criar */}
      <Modal open={showCreate} title="Novo perfil" onClose={() => setShowCreate(false)}>
        <form onSubmit={submitCreate}>
          <div className="field"><label>Nome</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Joao" />
          </div>
          <HuePicker hue={hue} setHue={setHue} name={name || "?"} />
          <button className="btn btn--primary btn--block" style={{ marginTop: 18 }} disabled={createUser.isPending}>Criar perfil</button>
        </form>
      </Modal>

      {/* Editar */}
      <Modal open={!!editing} title="Editar perfil" onClose={() => setEditing(null)}>
        <form onSubmit={submitEdit}>
          <div className="field"><label>Nome</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <HuePicker hue={hue} setHue={setHue} name={name || "?"} />
          <button className="btn btn--primary btn--block" style={{ marginTop: 18 }} disabled={updateUser.isPending}>Salvar</button>
        </form>
      </Modal>

      {/* Excluir */}
      <Confirm
        open={!!deleting}
        title="Excluir perfil"
        message={`Excluir "${deleting?.name}"? Todos os treinos e historico deste perfil serao removidos.`}
        onConfirm={async () => { if (deleting) { await deleteUser.mutateAsync(deleting.id); toast("Perfil excluido"); } }}
        onClose={() => setDeleting(null)}
      />

      {/* Senha admin */}
      <Modal open={!!adminFor} title="Acesso de administrador" onClose={() => setAdminFor(null)}>
        <form onSubmit={confirmAdmin}>
          <p className="muted" style={{ marginBottom: 14 }}>O perfil Admin pode ver e editar tudo. Digite a senha de admin.</p>
          <input type="password" autoFocus placeholder="Senha de admin" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} />
          <div className="gate__error" style={{ marginTop: 8 }}>{adminErr}</div>
          <button className="btn btn--primary btn--block" style={{ marginTop: 10 }} disabled={!adminPw}>Entrar como Admin</button>
        </form>
      </Modal>
    </div>
  );
}

function HuePicker({ hue, setHue, name }: { hue: number; setHue: (h: number) => void; name: string }) {
  return (
    <div className="field">
      <label>Cor do avatar</label>
      <div className="row wrap" style={{ gap: 12 }}>
        <Avatar name={name} hue={hue} size={48} />
        {HUES.map((h) => (
          <button type="button" key={h} onClick={() => setHue(h)}
            style={{
              width: 34, height: 34, borderRadius: 10, cursor: "pointer",
              border: hue === h ? "2px solid var(--text)" : "2px solid transparent",
              background: `hsl(${h} 70% 55%)`,
            }} aria-label={`cor ${h}`} />
        ))}
      </div>
    </div>
  );
}
