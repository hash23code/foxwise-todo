"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Settings,
  CalendarDays,
  FolderKanban,
  Clock,
  Folder
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    {
      name: t.nav?.dashboard || "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: (t.nav as any)?.tasks || "My Tasks",
      href: "/tasks",
      icon: CheckSquare,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      name: (t.nav as any)?.dayPlanner || "Day Planner",
      href: "/day-planner",
      icon: Clock,
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      name: language === 'fr' ? "Projets" : "Projects",
      href: "/projects",
      icon: Folder,
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      name: (t.nav as any)?.categories || "Categories",
      href: "/categories",
      icon: FolderKanban,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      name: t.nav?.calendar || "Calendar",
      href: "/calendar",
      icon: CalendarDays,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      name: t.nav?.settings || "Settings",
      href: "/settings",
      icon: Settings,
      gradient: "from-gray-500 to-slate-500"
    },
  ];

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-black border-r border-gray-800 flex flex-col"
    >
      {/* Logo */}
      <Link href="/" className="p-6 border-b border-gray-800 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
        <Image
          src="/logo.png"
          alt="FoxWise ToDo"
          width={160}
          height={160}
          className="object-contain"
          priority
        />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.name}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link href={item.href}>
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <span className="text-sm text-gray-400">{t.nav.profile}</span>
        </div>
      </div>
    </motion.aside>
  );
}
