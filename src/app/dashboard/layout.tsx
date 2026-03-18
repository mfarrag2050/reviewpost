import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';

export const metadata = {
    title: 'Dashboard — ReviewPost',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar
                user={{
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                    plan: session.user.plan,
                }}
            />

            {/* Main content */}
            <main className="flex-1 min-w-0 flex flex-col">
                {/* Top padding on mobile for hamburger button */}
                <div className="pt-16 md:pt-0 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
