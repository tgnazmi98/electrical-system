import { Dashboard } from "@/components/dashboard/Dashboard";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata = {
    title: "Dashboard - OpenGrid",
    description: "Real-time electrical meter monitoring dashboard",
};

export default function HomePage() {
    return (
        <AuthGuard>
            <Dashboard />
        </AuthGuard>
    );
}
