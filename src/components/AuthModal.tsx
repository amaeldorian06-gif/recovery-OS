import React, { useState } from 'react';
import { User, SEED_USERS } from '../server/store';
import { X, Lock, ShieldCheck, UserCheck, Key, ArrowRight, Building, Check } from 'lucide-react';

interface AuthModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSwitchUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'personas' | 'login'>('personas');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const matched = SEED_USERS.find(u => u.email.toLowerCase() === emailInput.toLowerCase().trim());
    if (matched) {
      onSwitchUser(matched);
      onClose();
    } else {
      setErrorMessage('Invalid credentials or unregistered organization user.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Authentication & Tenant Identity
              </h3>
              <p className="text-xs text-slate-400">
                Multi-Tenant Isolation & Role-Based Access Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Authentication Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Session Callout */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {currentUser ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  Active Authenticated Session
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Authenticated
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-100 text-sm flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>{currentUser.name}</span>
                </div>
                <div className="text-slate-400 flex flex-wrap items-center gap-2">
                  <span>{currentUser.email}</span>
                  <span>•</span>
                  <span className="text-indigo-300 font-mono">Org: {currentUser.organizationName} ({currentUser.organizationId})</span>
                  <span>•</span>
                  <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    Role: {currentUser.role}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Server-enforced Row Level Security active
                </span>
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 transition-colors font-medium text-[11px]"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300 text-[11px]">
              No active user session. Select a verified persona below or sign in.
            </div>
          )}

          {/* Persona Quick-Switch vs Manual Login Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('personas')}
              className={`pb-2 px-3 font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'personas'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Test Personas (Verify Tenant Isolation)
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`pb-2 px-3 font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === 'login'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Direct Login
            </button>
          </div>

          {activeTab === 'personas' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Switch between organizations to verify that <strong>Tenant A (Acme Advisory)</strong> can never see, modify, or export records belonging to <strong>Tenant B (Strata Media)</strong>.
              </p>

              <div className="space-y-2">
                {SEED_USERS.map(user => {
                  const isCurrent = currentUser?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        onSwitchUser(user);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200">{user.name}</span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {user.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                          <Building className="w-3 h-3 text-slate-500" />
                          <span>{user.organizationName}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{user.organizationId}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCurrent ? (
                          <span className="flex items-center space-x-1 text-emerald-400 font-semibold text-[11px]">
                            <Check className="w-4 h-4" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-200 text-[11px] font-medium transition-colors">
                            Switch
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleManualLogin} className="space-y-3">
              {errorMessage && (
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@acme-consulting.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow"
              >
                <span>Sign In to Organization</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Security Architecture Callout */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-Tenant Security Architecture</span>
            </div>
            <p>
              Every API call passes through server-side token validation. Invoices are strictly scoped by authoritative <code>organization_id</code>. Cross-organization reading, updating, or deleting returns 401/403.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
