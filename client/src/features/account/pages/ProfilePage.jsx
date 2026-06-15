import { useEffect, useState } from 'react';
import { UserCircle } from 'lucide-react';
import { apiRequest } from '@/api';
import { Notice } from '@/components/feedback/Notice';
import { useAuth } from '@/app/providers/AuthContext';
import { AccountProfilePanel } from '../components/AccountProfilePanel';
import { AccountSecurityPanel } from '../components/AccountSecurityPanel';
import { AccountDangerPanel } from '../components/AccountDangerPanel';

export function ProfilePage() {
  const { user, setUser, token, setToken, logout } = useAuth();

  const [usernameForm, setUsernameForm] = useState({ username: user?.username || '', currentPassword: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!user) return;
    setUsernameForm((c) => ({ ...c, username: user.username || '' }));
  }, [user?.username]);

  useEffect(() => {
    if (notice?.type === 'success') {
      const t = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  async function changeUsername(event) {
    event.preventDefault();
    const username = usernameForm.username.trim();
    if (username.length < 2) {
      setNotice({ type: 'error', message: 'Username must be at least 2 characters.' });
      return;
    }
    if (!usernameForm.currentPassword) {
      setNotice({ type: 'error', message: 'Enter your current password to change username.' });
      return;
    }
    setSavingUsername(true);
    setNotice(null);
    try {
      const data = await apiRequest('/auth/username', {
        method: 'PUT',
        token,
        body: { username, currentPassword: usernameForm.currentPassword },
      });
      setToken(data.token);
      setUser(data.user);
      setUsernameForm({ username: data.user.username, currentPassword: '' });
      setNotice({ type: 'success', message: 'Username updated.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSavingUsername(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      setNotice({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    setSavingPassword(true);
    setNotice(null);
    try {
      const data = await apiRequest('/auth/password', {
        method: 'PUT',
        token,
        body: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
      });
      if (data.token) setToken(data.token);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice({ type: 'success', message: 'Password updated.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteOwnAccount(event) {
    event.preventDefault();
    if (!deletePassword) {
      setNotice({ type: 'error', message: 'Enter your current password to delete the account.' });
      return;
    }
    const confirmed = window.confirm(
      `Delete ${user?.username || 'this account'} and all related predictions and points? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    setNotice(null);
    try {
      await apiRequest('/auth/account', { method: 'DELETE', token, body: { currentPassword: deletePassword } });
      logout();
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setDeletingAccount(false);
    }
  }

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

      {notice && <div className="mb-6"><Notice notice={notice} /></div>}

      <div className="space-y-6">
        <AccountProfilePanel
          user={user}
          form={usernameForm}
          setForm={setUsernameForm}
          saving={savingUsername}
          onSubmit={changeUsername}
        />
        <AccountSecurityPanel
          form={passwordForm}
          setForm={setPasswordForm}
          saving={savingPassword}
          onSubmit={changePassword}
        />
        <AccountDangerPanel
          username={user?.username}
          password={deletePassword}
          setPassword={setDeletePassword}
          saving={deletingAccount}
          onSubmit={deleteOwnAccount}
        />
      </div>
    </main>
  );
}
