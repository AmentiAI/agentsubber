"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Gift,
  List,
  ShoppingBag,
  Bot,
  Wallet,
  Bell,
  Settings,
  CreditCard,
  Eye,
  Handshake,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/communities", label: "My Communities", icon: Users },
  { href: "/dashboard/giveaways", label: "Giveaways", icon: Gift },
  { href: "/dashboard/allowlists", label: "Allowlists", icon: List },
  { href: "/dashboard/presales", label: "Presales", icon: ShoppingBag },
  { href: "/dashboard/collabs", label: "Collabs", icon: Handshake },
  { href: "/dashboard/agent", label: "My Agent", icon: Bot },
  { href: "/dashboard/wallets", label: "Wallets", icon: Wallet },
  { href: "/dashboard/tracker", label: "Wallet Tracker", icon: Eye },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                  : "text-[rgb(130,130,150)] hover:text-white hover:bg-[rgb(30,30,40)]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
