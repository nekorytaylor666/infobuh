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
			to: "/dashboard/documents",
			icon: FileText,
			children: "Документы",
			// items: [
			// 	{
			// 		to: "/dashboard/documents/folder/$folderId",
			// 		children: "Накладные",
			// 		params: {
			// 			folderId: "invoices",
			// 		},
			// 		icon: FileText,
			// 	},
			// 	{
			// 		to: "/dashboard/documents/folder/$folderId",
			// 		children: "АВР",
			// 		params: {
			// 			folderId: "avrs",
			// 		},
			// 		icon: FileText,
			// 	},
			// 	{
			// 		to: "/dashboard/documents/folder/$folderId",
			// 		children: "Счета-фактуры",
			// 		params: {
			// 			folderId: "invoices",
			// 		},
			// 		icon: FileText,
			// 	},
			// 	{
			// 		to: "/dashboard/documents/folder/$folderId",
			// 		children: "Договоры",
			// 		params: {
			// 			folderId: "contracts",
			// 		},
			// 		icon: FileText,
			// 	},
			// 	{
			// 		to: "/dashboard/documents/folder/$folderId",
			// 		children: "Акты сверки",
			// 		params: {
			// 			folderId: "checks",
			// 		},
			// 		icon: FileText,
			// 	},
			// ],
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
