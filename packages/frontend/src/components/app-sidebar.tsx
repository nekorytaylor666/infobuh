import * as React from "react";
import {
  FileText,
  Users,
  Calculator,
  Command,
  ClipboardList,
  FileSpreadsheet,
  Receipt,
  Files,
  FileCheck,
  Percent,
  DollarSign,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authService } from "@/services/auth";
import { useAuth } from "@/lib/auth";
import { useLegalEntity } from "@/hooks/use-legal-entity";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Документы",
      url: "#",
      icon: FileText,
      isActive: true,
      items: [
        {
          title: "Накладные",
          url: "#",
        },
        {
          title: "АВР",
          url: "#",
        },
        {
          title: "Счета-фактуры",
          url: "#",
        },
        {
          title: "Договоры",
          url: "#",
        },
        {
          title: "Акты сверки",
          url: "#",
        },
      ],
    },
    {
      title: "Сотрудники",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Список сотрудников",
          url: "#",
        },
        {
          title: "Должности",
          url: "#",
        },
        {
          title: "Отпуска",
          url: "#",
        },
        {
          title: "Больничные",
          url: "#",
        },
      ],
    },
    {
      title: "Калькуляторы",
      url: "#",
      icon: Calculator,
      items: [
        {
          title: "НДС",
          url: "#",
        },
        {
          title: "Налоги за сотрудников",
          url: "#",
        },
        {
          title: "ИПН",
          url: "#",
        },
        {
          title: "Социальные отчисления",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Помощь",
      url: "#",
      icon: FileText,
    },
    {
      title: "Настройки",
      url: "#",
      icon: Calculator,
    },
  ],
  projects: [
    {
      name: "Бухгалтерия",
      url: "#",
      icon: FileSpreadsheet,
    },
    {
      name: "Отчетность",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Архив",
      url: "#",
      icon: Files,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const { legalEntity, isLoading } = useLegalEntity();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {isLoading ? "Loading..." : legalEntity?.name}
                  </span>
                  <span className="truncate text-xs">
                    {isLoading ? "" : legalEntity?.type}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
