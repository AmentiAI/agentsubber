"use client";

import Navbar from "@/components/layout/Navbar";
import FeedView from "@/components/feed/FeedView";
import { Rss } from "lucide-react";

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-[rgb(10,10,15)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Rss className="w-7 h-7 text-purple-400" />
          <div>
            <h1 className="text-3xl font-black text-white">Feed</h1>
            <p className="text-sm text-[rgb(100,100,120)]">Posts from all communities</p>
          </div>
        </div>
        <FeedView />
      </div>
    </div>
  );
}
