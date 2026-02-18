"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  Wallet,
  X,
  Bot,
  Calendar,
} from "lucide-react";
import { truncateAddress } from "@/lib/utils";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const user = session?.user as any;
  const plan = user?.plan ?? "FREE";

  return (
    <nav className="sticky top-0 z-50 glass border-b border-[rgb(40,40,55)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm pulse-glow">
              C
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">
              Communi<span className="text-purple-400">claw</span>
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/discover">
              <Button variant="ghost" size="sm" className="gap-2">
                <Compass className="w-4 h-4" />
                Discover
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </Button>
            </Link>
            {session && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {session ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
                </Button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgb(40,40,55)] bg-[rgb(16,16,22)] hover:border-purple-500/50 transition-colors"
                  >
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold">
                        {user?.name?.[0] ?? "U"}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <div className="text-xs text-white font-medium leading-none">
                        {user?.xHandle ? `@${user.xHandle}` : user?.name ?? "User"}
                      </div>
                      <div className="text-xs text-[rgb(130,130,150)] leading-none mt-0.5">
                        {plan}
                      </div>
                    </div>
                    {plan !== "FREE" && (
                      <Badge
                        variant={plan === "ELITE" ? "default" : "secondary"}
                        className="hidden sm:flex text-xs py-0"
                      >
                        {plan}
                      </Badge>
                    )}
                    <ChevronDown className="w-3 h-3 text-[rgb(130,130,150)]" />
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[rgb(40,40,55)] bg-[rgb(16,16,22)] shadow-xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-[rgb(40,40,55)]">
                          <div className="text-sm font-medium text-white">
                            {user?.name ?? "User"}
                          </div>
                          <div className="text-xs text-[rgb(130,130,150)]">
                            {user?.xHandle ? `@${user.xHandle}` : user?.email}
                          </div>
                        </div>
                        <div className="p-1">
                          <NavDropdownItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => setProfileOpen(false)} />
                          <NavDropdownItem href="/dashboard/wallets" icon={<Wallet className="w-4 h-4" />} label="My Wallets" onClick={() => setProfileOpen(false)} />
                          <NavDropdownItem href="/dashboard/agent" icon={<Bot className="w-4 h-4" />} label="My Agent" onClick={() => setProfileOpen(false)} />
                          <NavDropdownItem href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => setProfileOpen(false)} />
                          <NavDropdownItem href="/dashboard/subscription" icon={<User className="w-4 h-4" />} label="Subscription" onClick={() => setProfileOpen(false)} />
                          <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => signIn("twitter")}>
                  Sign in
                </Button>
                <Button variant="gradient" size="sm" onClick={() => signIn("twitter")}>
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[rgb(40,40,55)] py-3 space-y-1">
            <MobileNavItem href="/discover" onClick={() => setMenuOpen(false)}>Discover</MobileNavItem>
            <MobileNavItem href="/calendar" onClick={() => setMenuOpen(false)}>Calendar</MobileNavItem>
            {session && (
              <MobileNavItem href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileNavItem>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavDropdownItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-[rgb(200,200,210)] hover:bg-[rgb(30,30,40)] hover:text-white rounded-lg transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavItem({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-[rgb(200,200,210)] hover:text-white hover:bg-[rgb(30,30,40)] rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
