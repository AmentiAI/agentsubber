"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, LayoutDashboard, Users, Building2, MessageSquare, Megaphone, Gift, CreditCard, Settings } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/communities", label: "Communities", icon: Building2 },
  { href: "/admin/giveaways", label: "Giveaways", icon: Gift },
  { href: "/admin/chat", label: "Live Chat", icon: MessageSquare },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const user = session?.user as any;

  useEffect(() => {
    if (status === "loading") return;
    if (!session || user?.xHandle !== "SigNullBTC") {
      router.replace("/");
    }
  }, [session, status, user, router]);

  if (status === "loading" || !session || user?.xHandle !== "SigNullBTC") {
    return (
      <div className="min-h-screen bg-[rgb(10,10,15)] flex items-center justify-center">
        <div className="text-[rgb(100,100,120)]">Checking authorization…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[rgb(25,25,38)] bg-[rgb(10,10,16)] flex flex-col">
        <div className="px-5 py-5 border-b border-[rgb(25,25,38)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white text-lg">Admin</span>
          </div>
          <div className="text-xs text-red-400 font-medium">@SigNullBTC access only</div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-red-600/20 text-red-300 border border-red-500/25"
                    : "text-[rgb(130,130,150)] hover:text-white hover:bg-[rgb(20,20,30)]"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-[rgb(25,25,38)]">
          <Link href="/dashboard" className="text-xs text-[rgb(100,100,120)] hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
