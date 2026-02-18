"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Gift,
  Bot,
  Wallet,
  CreditCard,
  Bell,
  Settings,
  List,
  ShoppingBag,
  Handshake,
  Eye,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/communities", label: "Communities", icon: Users },
  { href: "/dashboard/giveaways", label: "Giveaways", icon: Gift },
  { href: "/dashboard/wallets", label: "Wallets", icon: Wallet },
  { href: "/dashboard/agent", label: "Agent", icon: Bot },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[rgb(11,11,17)] border-t border-[rgb(30,30,45)] safe-area-bottom">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-purple-400"
                  : "text-[rgb(100,100,120)] hover:text-[rgb(160,160,180)]"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-purple-400")} />
              <span className="leading-none">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-purple-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
