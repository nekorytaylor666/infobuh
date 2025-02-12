import type { LinkProps } from "@tanstack/react-router";
import {
	type LucideIcon,
	FileText,
	Users,
	Briefcase,
	Calendar,
	Calculator,
	Percent,
	DollarSign,
	FileSpreadsheet,
	ClipboardList,
	Files,
} from "lucide-react";

export type NavItem = LinkProps & {
	children: string;
	icon: LucideIcon;
	items?: ReadonlyArray<LinkProps & { children: string; icon: LucideIcon }>;
};

export const data = {
	navMain: [
		{
			to: "/about",
			icon: FileText,
			children: "Документы",
			items: [
				{
					to: "/about",
					children: "Накладные",
					icon: FileText,
				},
				{
					to: "/about",
					children: "АВР",
					icon: FileText,
				},
				{
					to: "/about",
					children: "Счета-фактуры",
					icon: FileText,
				},
				{
					to: "/about",
					children: "Договоры",
					icon: FileText,
				},
				{
					to: "/about",
					children: "Акты сверки",
					icon: FileText,
				},
			],
		},
		{
			to: "/dashboard/employees",
			icon: Users,
			children: "Сотрудники",
			items: [
				{
					to: "/dashboard/employees",
					children: "Список сотрудников",
					icon: Users,
				},
				{
					to: "/about",
					children: "Должности",
					icon: Briefcase,
				},
				{
					to: "/about",
					children: "Отпуска",
					icon: Calendar,
				},
				{
					to: "/about",
					children: "Больничные",
					icon: Calendar,
				},
			],
		},
		{
			to: "/about",
			icon: Calculator,
			children: "Калькуляторы",
			items: [
				{
					to: "/about",
					children: "НДС",
					icon: Percent,
				},
				{
					to: "/about",
					children: "Налоги за сотрудников",
					icon: DollarSign,
				},
				{
					to: "/about",
					children: "ИПН",
					icon: Percent,
				},
				{
					to: "/about",
					children: "Социальные отчисления",
					icon: Percent,
				},
			],
		},
	],
	navSecondary: [
		{
			to: "/about",
			icon: FileText,
			children: "Помощь",
		},
		{
			to: "/about",
			icon: Calculator,
			children: "Настройки",
		},
	],
	projects: [
		{
			children: "Бухгалтерия",
			to: "/about",
			icon: FileSpreadsheet,
		},
		{
			children: "Отчетность",
			to: "/about",
			icon: ClipboardList,
		},
		{
			children: "Архив",
			to: "/about",
			icon: Files,
		},
	],
} as const satisfies {
	[key: string]: ReadonlyArray<NavItem>;
};
