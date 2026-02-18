"use client";

import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function PresalesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-8">
              <ShoppingBag className="w-6 h-6 text-green-400" />
              <h1 className="text-2xl font-bold text-white">Presales</h1>
            </div>
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-[rgb(130,130,150)] mx-auto mb-4 opacity-30" />
              <h3 className="text-white font-semibold mb-2">Browse Presales</h3>
              <p className="text-[rgb(130,130,150)] text-sm mb-6">
                Active presales from communities you follow will appear here.
              </p>
              <Link
                href="/discover"
                className="text-purple-400 hover:text-purple-300 text-sm underline underline-offset-2"
              >
                Discover communities →
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
