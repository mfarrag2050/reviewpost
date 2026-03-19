'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/admin/Toast';

interface SystemSettings {
    ai_model: string;
    ai_temperature: string;
    ai_fallback_model: string;
    email_provider: string;
    email_from: string;
    telegram_bot_token: string;
    telegram_chat_id: string;
    maintenance_mode: string;
}

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
}

const DEFAULTS: SystemSettings = {
    ai_model: 'gpt-4o-mini',
    ai_temperature: '0.7',
    ai_fallback_model: 'gpt-3.5-turbo',
    email_provider: 'resend',
    email_from: 'noreply@reviewpost.io',
    telegram_bot_token: '',
    telegram_chat_id: '',
    maintenance_mode: 'false',
};

export default function AdminSystemPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SystemSettings>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/system')
            .then((r) => r.json())
            .then((d) => {
                setSettings({ ...DEFAULTS, ...d.settings });
                setLogs(d.logs ?? []);
            })
            .catch(() => toast('Failed to load settings', 'error'))
            .finally(() => { setLoading(false); setLogsLoading(false); });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/system', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            if (!res.ok) throw new Error();
            toast('Settings saved', 'success');
        } catch {
            toast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const set = (key: keyof SystemSettings, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const isMaintenanceMode = settings.maintenance_mode === 'true';

    return (
        <div className="p-6 md:p-8 max-w-[1000px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Settings</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Configure platform-wide settings</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Saving…
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save All Changes
                        </>
                    )}
                </button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 h-40 animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Maintenance Mode Banner */}
                    {isMaintenanceMode && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/30 border border-amber-700 rounded-xl text-amber-400">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-sm font-semibold">Maintenance mode is ON — users cannot access the platform</span>
                        </div>
                    )}

                    {/* AI Settings */}
                    <SettingsSection title="AI Settings" icon="🤖">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SettingField label="Default Model">
                                <select
                                    value={settings.ai_model}
                                    onChange={(e) => set('ai_model', e.target.value)}
                                    className="admin-setting-input"
                                >
                                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                                    <option value="gpt-4o">gpt-4o</option>
                                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                                </select>
                            </SettingField>
                            <SettingField label="Temperature (0–2)">
                                <input
                                    type="number"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={settings.ai_temperature}
                                    onChange={(e) => set('ai_temperature', e.target.value)}
                                    className="admin-setting-input"
                                />
                            </SettingField>
                            <SettingField label="Fallback Model">
                                <select
                                    value={settings.ai_fallback_model}
                                    onChange={(e) => set('ai_fallback_model', e.target.value)}
                                    className="admin-setting-input"
                                >
                                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                                </select>
                            </SettingField>
                        </div>
                    </SettingsSection>

                    {/* Email Settings */}
                    <SettingsSection title="Email Settings" icon="📧">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingField label="Email Provider">
                                <select
                                    value={settings.email_provider}
                                    onChange={(e) => set('email_provider', e.target.value)}
                                    className="admin-setting-input"
                                >
                                    <option value="resend">Resend</option>
                                    <option value="ses">AWS SES</option>
                                    <option value="sendgrid">SendGrid</option>
                                    <option value="smtp">SMTP</option>
                                </select>
                            </SettingField>
                            <SettingField label="From Address">
                                <input
                                    type="email"
                                    value={settings.email_from}
                                    onChange={(e) => set('email_from', e.target.value)}
                                    placeholder="noreply@reviewpost.io"
                                    className="admin-setting-input"
                                />
                            </SettingField>
                        </div>
                    </SettingsSection>

                    {/* Notification Settings */}
                    <SettingsSection title="Telegram Notifications" icon="📱">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingField label="Bot Token">
                                <input
                                    type="password"
                                    value={settings.telegram_bot_token}
                                    onChange={(e) => set('telegram_bot_token', e.target.value)}
                                    placeholder="1234567890:AAF…"
                                    className="admin-setting-input font-mono"
                                />
                            </SettingField>
                            <SettingField label="Chat ID">
                                <input
                                    type="text"
                                    value={settings.telegram_chat_id}
                                    onChange={(e) => set('telegram_chat_id', e.target.value)}
                                    placeholder="-100…"
                                    className="admin-setting-input font-mono"
                                />
                            </SettingField>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">These override .env values when set in DB</p>
                    </SettingsSection>

                    {/* Maintenance Mode */}
                    <SettingsSection title="Maintenance" icon="🔧">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-200">Maintenance Mode</p>
                                <p className="text-xs text-slate-500 mt-0.5">When enabled, all users see a maintenance page</p>
                            </div>
                            <button
                                onClick={() => set('maintenance_mode', isMaintenanceMode ? 'false' : 'true')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </SettingsSection>

                    {/* System Logs */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                            <h2 className="text-sm font-semibold text-slate-200">System Logs</h2>
                            <span className="text-xs text-slate-500">Last 100 entries</span>
                        </div>
                        <div className="bg-slate-900 rounded-b-2xl max-h-80 overflow-y-auto">
                            {logsLoading ? (
                                <div className="p-4 text-slate-500 text-sm">Loading logs…</div>
                            ) : logs.length === 0 ? (
                                <div className="p-4 text-slate-500 text-sm">No logs available</div>
                            ) : (
                                <table className="w-full text-xs font-mono">
                                    <tbody>
                                        {logs.map((log, i) => (
                                            <tr key={i} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50">
                                                <td className="px-4 py-2 text-slate-600 whitespace-nowrap w-44">{log.timestamp}</td>
                                                <td className="px-2 py-2 w-16">
                                                    <LogLevelBadge level={log.level} />
                                                </td>
                                                <td className="px-2 py-2 text-slate-300 pr-4">{log.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}

            <style jsx global>{`
                .admin-setting-input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    background: rgb(30 41 59);
                    border: 1px solid rgb(71 85 105);
                    border-radius: 0.75rem;
                    font-size: 0.875rem;
                    color: rgb(226 232 240);
                    outline: none;
                }
                .admin-setting-input:focus {
                    border-color: rgb(99 102 241);
                    box-shadow: 0 0 0 1px rgb(99 102 241);
                }
            `}</style>
        </div>
    );
}

function SettingsSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-700">
                <span>{icon}</span>
                <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function LogLevelBadge({ level }: { level: string }) {
    const styles: Record<string, string> = {
        ERROR: 'text-red-400',
        WARN: 'text-amber-400',
        INFO: 'text-indigo-400',
        DEBUG: 'text-slate-500',
    };
    return <span className={`font-bold uppercase ${styles[level] ?? 'text-slate-400'}`}>{level}</span>;
}
