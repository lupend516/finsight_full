import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, members, invitations, type CompanyMember, type Invitation, type Role } from '../lib/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Bell, User, Building2, CreditCard, Lock, Shield,
  FileText, AlertCircle, Users, Mail, Loader2,
  UserPlus, Trash2, RefreshCw, Copy, CheckCircle2
} from 'lucide-react';

const ROLE_LABELS: Record<Role, string> = {
  owner:      'Owner',
  admin:      'Admin',
  accountant: 'Accountant',
  analyst:    'Analyst',
  viewer:     'Viewer',
};

const ROLE_COLORS: Record<Role, string> = {
  owner:      'bg-purple-100 text-purple-700',
  admin:      'bg-blue-100 text-blue-700',
  accountant: 'bg-green-100 text-green-700',
  analyst:    'bg-yellow-100 text-yellow-700',
  viewer:     'bg-slate-100 text-slate-700',
};

export function Settings() {
  const { user, company, refreshUser } = useAuth();

  // ── Account tab ──────────────────────────
  const [firstName, setFirstName]   = useState(user?.first_name ?? '');
  const [lastName, setLastName]     = useState(user?.last_name ?? '');
  const [oldPass, setOldPass]       = useState('');
  const [newPass, setNewPass]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passMsg, setPassMsg]       = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading]       = useState(false);

  // ── Notifications tab ────────────────────
  const [notifs, setNotifs] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    financialRisks: true,
    fraudAlerts: true,
    reportsAvailability: true,
    billingUpdates: true,
  });

  // ── Team tab ─────────────────────────────
  const [teamMembers, setTeamMembers]       = useState<CompanyMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [teamLoading, setTeamLoading]       = useState(false);
  const [inviteEmail, setInviteEmail]       = useState('');
  const [inviteRole, setInviteRole]         = useState<Role>('viewer');
  const [inviteLoading, setInviteLoading]   = useState(false);
  const [inviteLink, setInviteLink]         = useState('');
  const [linkCopied, setLinkCopied]         = useState(false);
  const [teamError, setTeamError]           = useState('');

  const myRole = teamMembers.find(m => m.user_id === user?.id)?.role ?? 'viewer';
  const canManageTeam = myRole === 'owner' || myRole === 'admin';

  useEffect(() => {
    if (company) loadTeam();
  }, [company]);

  const loadTeam = async () => {
    if (!company) return;
    setTeamLoading(true);
    try {
      const [mem, inv] = await Promise.all([
        members.list(company.id),
        invitations.list(company.id),
      ]);
      setTeamMembers(mem);
      setPendingInvites(inv.filter(i => i.status === 'pending'));
    } catch (e: any) {
      setTeamError(e.message);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!company || !inviteEmail) return;
    setInviteLoading(true);
    setTeamError('');
    setInviteLink('');
    try {
      const res = await invitations.invite(company.id, { email: inviteEmail, role: inviteRole });
      setInviteLink(res.invite_link);
      setInviteEmail('');
      loadTeam();
    } catch (e: any) {
      setTeamError(e.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, role: Role) => {
    if (!company) return;
    try {
      await members.updateRole(company.id, userId, role);
      loadTeam();
    } catch (e: any) {
      setTeamError(e.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!company || !confirm('Remove this member?')) return;
    try {
      await members.remove(company.id, userId);
      loadTeam();
    } catch (e: any) {
      setTeamError(e.message);
    }
  };

  const handleRevokeInvite = async (invId: string) => {
    if (!company) return;
    try {
      await invitations.revoke(company.id, invId);
      loadTeam();
    } catch (e: any) {
      setTeamError(e.message);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg('');
    try {
      await auth.updateProfile({ first_name: firstName, last_name: lastName });
      await refreshUser();
      setProfileMsg('Profile saved!');
    } catch (e: any) {
      setProfileMsg(e.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) { setPassMsg("Passwords don't match"); return; }
    setPassLoading(true);
    setPassMsg('');
    try {
      await auth.changePassword({ old_password: oldPass, new_password: newPass });
      setOldPass(''); setNewPass(''); setConfirmPass('');
      setPassMsg('Password changed!');
    } catch (e: any) {
      setPassMsg(e.message);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Settings</h3>
        <p className="text-slate-600 mt-1">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account"><User size={16} className="mr-2" />Account</TabsTrigger>
          <TabsTrigger value="team"><Users size={16} className="mr-2" />Team</TabsTrigger>
          <TabsTrigger value="notifications"><Bell size={16} className="mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard size={16} className="mr-2" />Billing</TabsTrigger>
        </TabsList>

        {/* ── ACCOUNT TAB ─────────────────────── */}
        <TabsContent value="account" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Personal Information</h3>
            <p className="text-sm text-slate-600 mb-6">Update your name and profile</p>
            <div className="space-y-4 max-w-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled className="mt-1 bg-slate-50" />
              </div>
              {profileMsg && (
                <p className={`text-sm ${profileMsg.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>
              )}
              <Button onClick={handleSaveProfile} disabled={profileLoading}>
                {profileLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Change Password</h3>
            <p className="text-sm text-slate-600 mb-6">Use a strong password (min 8 characters)</p>
            <div className="space-y-4 max-w-md">
              <div>
                <Label>Current Password</Label>
                <Input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="mt-1" placeholder="••••••••" />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="mt-1" placeholder="••••••••" />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="mt-1" placeholder="••••••••" />
              </div>
              {passMsg && (
                <p className={`text-sm ${passMsg.includes('changed') ? 'text-green-600' : 'text-red-600'}`}>{passMsg}</p>
              )}
              <Button variant="outline" onClick={handleChangePassword} disabled={passLoading}>
                {passLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Lock size={16} className="mr-2" />}
                Update Password
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── TEAM TAB ────────────────────────── */}
        <TabsContent value="team" className="space-y-6">

          {/* Invite new member */}
          {canManageTeam && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <UserPlus size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Invite Team Member</h3>
              </div>

              {teamError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />{teamError}
                </div>
              )}

              <div className="flex gap-3 max-w-xl">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={v => setInviteRole(v as Role)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['admin','accountant','analyst','viewer'] as Role[]).map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={inviteLoading}>
                  {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send Invite'}
                </Button>
              </div>

              {/* Role descriptions */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 max-w-xl">
                <p><strong>Admin</strong> — full access except billing</p>
                <p><strong>Accountant</strong> — data upload + reports</p>
                <p><strong>Analyst</strong> — read reports + AI chat</p>
                <p><strong>Viewer</strong> — dashboard read-only</p>
              </div>

              {/* Invite link result */}
              {inviteLink && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Invitation created! Share this link:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={inviteLink} readOnly className="text-xs bg-white flex-1" />
                    <Button size="sm" variant="outline" onClick={handleCopyLink}>
                      {linkCopied ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} />}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Current members */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Team Members ({teamMembers.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={loadTeam} disabled={teamLoading}>
                <RefreshCw size={14} className={teamLoading ? 'animate-spin' : ''} />
              </Button>
            </div>

            {teamLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2 size={20} className="animate-spin mr-2" /> Loading...
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No members yet</p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                        {(member.user.first_name?.[0] ?? '') + (member.user.last_name?.[0] ?? '')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {member.user.first_name} {member.user.last_name}
                          {member.user_id === user?.id && (
                            <span className="ml-2 text-xs text-slate-500">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Change role — owner can change anyone except owner; admin can change non-owner */}
                      {canManageTeam && member.role !== 'owner' && member.user_id !== user?.id ? (
                        <Select value={member.role} onValueChange={v => handleChangeRole(member.user_id, v as Role)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['admin','accountant','analyst','viewer'] as Role[]).map(r => (
                              <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`${ROLE_COLORS[member.role]} text-xs`}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      )}

                      {canManageTeam && member.role !== 'owner' && member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.user_id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending invitations */}
          {pendingInvites.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Pending Invitations ({pendingInvites.length})
              </h3>
              <div className="space-y-3">
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-amber-600" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{inv.email}</p>
                        <p className="text-xs text-slate-500">
                          Role: {ROLE_LABELS[inv.role]} · Expires: {new Date(inv.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {canManageTeam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRevokeInvite(inv.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ───────────────── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Notification Preferences</h3>
            <p className="text-sm text-slate-600 mb-6">Choose how you want to be notified</p>
            <div className="space-y-5">
              {[
                { key: 'emailNotifications',   label: 'Email Notifications',     desc: 'Receive notifications via email' },
                { key: 'inAppNotifications',   label: 'In-App Notifications',    desc: 'Show notifications within the app' },
                { key: 'financialRisks',       label: 'Financial Risks',         desc: 'Cash flow warnings, unusual patterns', icon: AlertCircle, color: 'red' },
                { key: 'fraudAlerts',          label: 'Fraud Alerts',            desc: 'Suspicious transactions and anomalies', icon: Shield, color: 'orange' },
                { key: 'reportsAvailability',  label: 'Reports Availability',    desc: 'When new reports are ready', icon: FileText, color: 'blue' },
                { key: 'billingUpdates',       label: 'Billing & Subscription',  desc: 'Payment confirmations, renewals', icon: CreditCard, color: 'purple' },
              ].map(({ key, label, desc, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {Icon && (
                      <div className={`w-9 h-9 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                        <Icon size={18} className={`text-${color}-600`} />
                      </div>
                    )}
                    <div>
                      <Label className="text-slate-900">{label}</Label>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifs[key as keyof typeof notifs]}
                    onCheckedChange={v => setNotifs({ ...notifs, [key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t">
              <Button>Save Notification Settings</Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── BILLING TAB ─────────────────────── */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Billing & Subscription</h3>
            <p className="text-sm text-slate-600 mb-6">
              Current plan: <span className="font-semibold capitalize">{company?.plan ?? 'free'}</span>
            </p>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 capitalize">{company?.plan ?? 'Free'} Plan</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {company?.plan === 'free' ? 'Free' : '90,000 KZT / month'}
                  </p>
                </div>
                <Button variant="outline" className="bg-white">Upgrade Plan</Button>
              </div>
            </div>
            <p className="text-sm text-slate-500">Payment history and invoices will appear here once you upgrade.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
