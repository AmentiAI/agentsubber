"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { getChainColor, getChainIcon } from "@/lib/utils";

interface MintEvent {
  id: string;
  mintDate: string;
  mintPrice: number | null;
  mintPriceToken: string | null;
  chain: string;
  spotsAvailable: number | null;
  mintUrl: string | null;
  description: string | null;
  community: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<MintEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    const start = monthStart.toISOString();
    const end = monthEnd.toISOString();
    setLoading(true);
    fetch(`/api/calendar?start=${start}&end=${end}`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .finally(() => setLoading(false));
  }, [currentDate]);

  const eventsOnDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.mintDate), day));

  const selectedEvents = selectedDay
    ? events.filter((e) => isSameDay(new Date(e.mintDate), selectedDay))
    : [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-purple-400" />
              Mint Calendar
            </h1>
            <p className="text-[rgb(130,130,150)]">
              Upcoming NFT mints across Solana &amp; Bitcoin Ordinals
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-white font-semibold text-lg">
                    {format(currentDate, "MMMM yyyy")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-xs text-[rgb(130,130,150)] py-1 font-medium">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for day offset */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {days.map((day) => {
                      const dayEvents = eventsOnDay(day);
                      const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                      const todayDay = isToday(day);
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDay(isSelected ? null : day)}
                          className={`
                            relative aspect-square rounded-lg p-1 text-sm font-medium transition-colors
                            ${todayDay ? "ring-1 ring-purple-500" : ""}
                            ${isSelected ? "bg-purple-600 text-white" : "hover:bg-[rgb(30,30,40)] text-[rgb(200,200,210)]"}
                          `}
                        >
                          <span>{format(day, "d")}</span>
                          {dayEvents.length > 0 && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {dayEvents.slice(0, 3).map((e, i) => (
                                <div
                                  key={i}
                                  className={`w-1 h-1 rounded-full ${
                                    e.chain === "SOL" ? "bg-purple-400" : "bg-orange-400"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[rgb(40,40,55)]">
                  <div className="flex items-center gap-1.5 text-xs text-[rgb(130,130,150)]">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    Solana
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[rgb(130,130,150)]">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    Bitcoin Ordinals
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events sidebar */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">
              {selectedDay
                ? `Mints on ${format(selectedDay, "MMM d")}`
                : "Upcoming Mints"}
            </h3>

            {(selectedDay ? selectedEvents : events.slice(0, 10)).length === 0 ? (
              <div className="text-center py-10 text-[rgb(130,130,150)] text-sm">
                {selectedDay ? "No mints on this day." : "No upcoming mints."}
              </div>
            ) : (
              <div className="space-y-3">
                {(selectedDay ? selectedEvents : events.slice(0, 10)).map((event) => (
                  <MintEventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MintEventCard({ event }: { event: MintEvent }) {
  const chainColor = getChainColor(event.chain);
  const chainIcon = getChainIcon(event.chain);

  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {event.community.logoUrl ? (
                <img
                  src={event.community.logoUrl}
                  alt={event.community.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                event.community.name[0]
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/c/${event.community.slug}`}
                className="text-sm font-medium text-white hover:text-purple-400 transition-colors truncate block"
              >
                {event.community.name}
              </Link>
              <div className="text-xs text-[rgb(130,130,150)]">
                {format(new Date(event.mintDate), "MMM d, h:mm a")}
              </div>
            </div>
          </div>
          <span className={`text-sm font-bold ${chainColor} shrink-0`}>{chainIcon}</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          {event.mintPrice && (
            <Badge variant="secondary" className="text-xs">
              {event.mintPrice} {event.mintPriceToken ?? event.chain}
            </Badge>
          )}
          {event.spotsAvailable && (
            <Badge variant="outline" className="text-xs">
              {event.spotsAvailable} spots
            </Badge>
          )}
          {event.mintUrl && (
            <a
              href={event.mintUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto"
            >
              <Button variant="ghost" size="icon" className="w-7 h-7">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
