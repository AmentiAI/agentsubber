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
    <aside className="w-72 shrink-0 hidden lg:block border-r border-[rgb(25,25,38)] bg-[rgb(11,11,17)]">
      <div className="sticky top-20 py-4 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all",
                isActive
                  ? "bg-purple-600/20 text-purple-200 border border-purple-500/25"
                  : "text-[rgb(140,140,165)] hover:text-white hover:bg-[rgb(22,22,35)]"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-purple-400" : "")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
