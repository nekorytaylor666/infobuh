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
  LucideIcon,
  Briefcase,
  Calendar,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
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
import { useAuthContext } from "@/lib/auth";
import { useLegalEntity } from "@/hooks/use-legal-entity";
import {
  Link,
  type LinkProps,
  type RegisteredRouter,
} from "@tanstack/react-router";
import { data } from "./config";
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();
  const { legalEntity, isLoading } = useLegalEntity();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={"/dashboard"}>
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
              </Link>
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
