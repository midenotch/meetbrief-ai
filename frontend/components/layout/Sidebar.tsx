"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SidebarProps {
  userEmail: string;
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/meetings", label: "Meetings", icon: Calendar },
  ];

  return (
    <aside className="w-[var(--sidebar-width)] h-screen flex flex-col border-r border-gray-100 bg-white flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/meetings" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">MeetBrief</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                active
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={12} className="text-gray-500" />
          </div>
          <span className="text-xs text-gray-500 truncate flex-1">{userEmail}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
