import { UserCircle } from 'lucide-react';
import { AccountProfilePanel } from '../components/AccountProfilePanel';
import { AccountSecurityPanel } from '../components/AccountSecurityPanel';
import { AccountDangerPanel } from '../components/AccountDangerPanel';

export function ProfilePage({
  user,
  notice,
  usernameForm,
  setUsernameForm,
  savingUsername,
  onChangeUsername,
  passwordForm,
  setPasswordForm,
  savingPassword,
  onChangePassword,
  deletePassword,
  setDeletePassword,
  deletingAccount,
  onDeleteAccount,
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">
          <UserCircle className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Account Settings</h1>
          <p className="text-sm text-slate-500">{user?.username}</p>
        </div>
      </div>

      {notice && <div className="mb-6">{notice}</div>}

      <div className="space-y-6">
        <AccountProfilePanel
          user={user}
          form={usernameForm}
          setForm={setUsernameForm}
          saving={savingUsername}
          onSubmit={onChangeUsername}
        />
        <AccountSecurityPanel
          form={passwordForm}
          setForm={setPasswordForm}
          saving={savingPassword}
          onSubmit={onChangePassword}
        />
        <AccountDangerPanel
          username={user?.username}
          password={deletePassword}
          setPassword={setDeletePassword}
          saving={deletingAccount}
          onSubmit={onDeleteAccount}
        />
      </div>
    </main>
  );
}
