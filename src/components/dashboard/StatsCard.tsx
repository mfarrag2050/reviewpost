'use client';

interface Trend {
    value: number;
    label: string;
}

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: Trend;
    icon: React.ReactNode;
    accentClass?: string;
    /** Use brand CSS variable for accent instead of Tailwind class */
    useBrandAccent?: boolean;
    loading?: boolean;
}

export function StatsCard({
    title,
    value,
    subtitle,
    trend,
    icon,
    accentClass = 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    useBrandAccent = false,
    loading = false,
}: StatsCardProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse">
                <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                    </div>
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div
                            className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${
                                trend.value >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-500 dark:text-red-400'
                            }`}
                        >
                            <span>{trend.value >= 0 ? '↑' : '↓'}</span>
                            <span>
                                {Math.abs(trend.value)}% {trend.label}
                            </span>
                        </div>
                    )}
                </div>
                <div
                    className={`p-3 rounded-xl flex-shrink-0 ${useBrandAccent ? '' : accentClass}`}
                    style={useBrandAccent ? {
                        backgroundColor: 'var(--brand-primary-light)',
                        color: 'var(--brand-primary)',
                    } : undefined}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}
