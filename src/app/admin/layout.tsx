import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ToastProvider } from '@/components/admin/Toast';

export const metadata = {
    title: 'Admin — ReviewPost',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    return (
        <ToastProvider>
            <div className="flex min-h-screen bg-slate-950">
                <AdminSidebar
                    user={{
                        name: session.user.name,
                        email: session.user.email,
                        image: session.user.image,
                    }}
                />
                <main className="flex-1 min-w-0 flex flex-col">
                    <div className="pt-16 md:pt-0 flex-1">
                        {children}
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
