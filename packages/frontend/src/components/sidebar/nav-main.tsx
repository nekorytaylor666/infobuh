import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import type { NavItem } from "./config";

export function NavMain({ items }: { items: ReadonlyArray<NavItem> }) {
  const location = useRouterState({ select: (s) => s.location });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Главное</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          console.log("Current pathname:", location.pathname);
          console.log("Current item.to:", item.to);
          console.log(
            "Includes check result:",
            location.pathname.includes(item.to ?? "")
          );

          return (
            <Collapsible
              key={item.children}
              asChild
              defaultOpen={location.pathname.includes(item.to ?? "")}
            >
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.children}>
                  <Link to={item.to}>
                    <item.icon />
                    <span>{item.children}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.children}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                activeProps={{
                                  className:
                                    "bg-primary/5 text-primary font-medium",
                                }}
                                to={subItem.to}
                              >
                                <span>{subItem.children}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
