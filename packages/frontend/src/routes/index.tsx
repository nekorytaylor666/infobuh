"use client";
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion-motion";
import { ArrowRight, ChevronUp, Zap, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, AnimatePresence, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import "./landing/index.css";
import mockup1 from "@/assets/infobuhmockup1.png";
import mockup2 from "@/assets/infobuhmockup2.png";
import mockup3 from "@/assets/infobuhmockup3.png";
import mockup4 from "@/assets/infobuhmockup4.png";
import mockup5 from "@/assets/infobuhmockup5.png";
import mockup6 from "@/assets/infobuhmockup6.png";
import mockup7 from "@/assets/infobuhmockup7.png";
import logo from "@/assets/logo.svg";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

// BarShine component for subtle border effects
function BarShine({ className }: { className?: string }) {
	return (
		<motion.div
			className={cn(
				"absolute top-0 left-0 z-10 h-[1px] w-full bg-gradient-to-r from-transparent from-10% via-gray-400 via-30% to-transparent to-90%",
				className,
			)}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5, delay: 1 }}
		/>
	);
}

// Stats Section Component with Animated Numbers
function Stats1() {
	const [values, setValues] = React.useState([0, 0, 0, 0]);
	const ref = React.useRef(null);
	const isInView = useInView(ref, { margin: "-100px" });

	if (isInView && values[0] === 0) {
		setValues([80, 10, 300, 90]);
	}

	return (
		<div
			ref={ref}
			className="relative mx-auto max-w-7xl px-8 py-12 md:px-12 lg:px-24"
		>
			<dl className="grid grid-cols-1 gap-x-6 gap-y-12 text-center sm:grid-cols-2 md:grid-cols-4">
				<div className="flex flex-col">
					<dt className="mt-1 text-base text-gray-600">
						секунд на создание сделки
					</dt>
					<dd className="order-first text-4xl font-normal text-gray-900">
						<AnimatedNumber
							value={values[0]}
							springOptions={{ bounce: 0, duration: 2000 }}
						/>
					</dd>
				</div>
				<div className="flex flex-col">
					<dt className="mt-1 text-base text-gray-600">
						раз меньше ручного труда
					</dt>
					<dd className="order-first text-4xl font-normal text-gray-900">
						<AnimatedNumber
							value={values[1]}
							springOptions={{ bounce: 0, duration: 2000 }}
						/>
						×
					</dd>
				</div>
				<div className="flex flex-col">
					<dt className="mt-1 text-base text-gray-600">компаний уже с нами</dt>
					<dd className="order-first text-4xl font-normal text-gray-900">
						<AnimatedNumber
							value={values[2]}
							springOptions={{ bounce: 0, duration: 2000 }}
						/>
						+
					</dd>
				</div>
				<div className="flex flex-col">
					<dt className="mt-1 text-base text-gray-600">
						процентов автоматизации
					</dt>
					<dd className="order-first text-4xl font-normal text-gray-900">
						<AnimatedNumber
							value={values[3]}
							springOptions={{ bounce: 0, duration: 2000 }}
						/>
						%
					</dd>
				</div>
			</dl>
		</div>
	);
}

// Navigation component with scroll-aware styling
function Navigation() {
	const [hasScrolled, setHasScrolled] = React.useState(false);
	const { scrollYProgress } = useScroll({
		offset: ["start start", "100px start"],
	});

	React.useEffect(() => {
		const unsubscribe = scrollYProgress.on("change", (latest) => {
			setHasScrolled(latest > 0);
		});
		return () => unsubscribe();
	}, [scrollYProgress]);

	return (
		<div className="fixed top-4 sm:top-8 z-50 w-full px-4">
			<div className="mx-auto w-full max-w-screen-xl">
				<div
					className={cn(
						`flex w-full items-center justify-between rounded-xl border transition-all duration-200 ease-out px-4 py-2`,
						hasScrolled
							? "border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm"
							: "border-transparent bg-transparent backdrop-blur-0",
					)}
				>
					<a href="#" className="flex items-center gap-2">
						<img src={logo} alt="Infobuh" className="h-6 w-6 sm:h-8 sm:w-8" />
						<span className="text-lg sm:text-xl font-semibold text-gray-900">
							Infobuh
						</span>
					</a>
					<nav className="flex items-center gap-x-2 sm:gap-x-6">
						<a
							href="#how"
							className="hidden sm:inline-block text-sm font-normal text-gray-600 transition-colors hover:text-gray-900"
						>
							Как это работает
						</a>
						<a
							href="#features"
							className="hidden sm:inline-block text-sm font-normal text-gray-600 transition-colors hover:text-gray-900"
						>
							Возможности
						</a>
						<a
							href="#pricing"
							className="hidden md:inline-block text-sm font-normal text-gray-600 transition-colors hover:text-gray-900"
						>
							Цены
						</a>
					</nav>
				</div>
			</div>
		</div>
	);
}

function HomeComponent() {
	const images = React.useMemo(
		() => [mockup1, mockup2, mockup3, mockup4, mockup5, mockup6, mockup7],
		[],
	);
	const [idx, setIdx] = React.useState(0);

	React.useEffect(() => {
		const id = setInterval(() => {
			setIdx((i) => (i + 1) % images.length);
		}, 1300);
		return () => clearInterval(id);
	}, [images.length]);

	const VARIANTS = {
		hidden: { opacity: 0, y: 10, filter: "blur(10px)" },
		visible: { opacity: 1, y: 0, filter: "blur(0px)" },
	};

	return (
		<div className="min-h-screen bg-white">
			<Navigation />

			{/* Hero Section */}
			<section className="px-4 pb-12 pt-24 sm:pt-32">
				<div className="container mx-auto">
					<div className="flex flex-col items-center justify-center gap-6 text-center">
						<div className="flex flex-col items-center gap-3">
							<motion.a
								href="#"
								className="group inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-sm leading-normal text-gray-700"
								variants={{ ...VARIANTS }}
								initial="hidden"
								animate="visible"
								transition={{ duration: 0.5, delay: 0.3 }}
							>
								<Zap className="h-4 w-4 fill-gray-700 stroke-gray-700" />
								<span className="font-medium">Новое:</span>
								ИИ-ассистент для документов{" "}
								<ChevronRight className="h-4 w-4 transition-all duration-200 ease-out group-hover:translate-x-0.5" />
							</motion.a>
							<TextEffect
								className="text-balance text-2xl tracking-tight text-gray-900 sm:text-5xl"
								as="h1"
								variants={{ item: VARIANTS }}
								speedReveal={1.5}
								speedSegment={0.5}
								delay={0.2}
								per="char"
							>
								Простая бухгалтерия для казахстанских бизнесов
							</TextEffect>
							<TextEffect
								className="text-base font-normal text-gray-600 sm:text-lg"
								as="p"
								variants={{ item: VARIANTS }}
								speedReveal={2}
								speedSegment={1}
								delay={0.35}
								segmentWrapperClassName="overflow-hidden"
								per="word"
							>
								Сокращает ручной труд в 10 раз. Автоматизирует 90% рутины
							</TextEffect>
						</div>
						<div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
							<motion.div
								variants={{ ...VARIANTS }}
								initial="hidden"
								animate="visible"
								transition={{ duration: 0.5, delay: 0.6 }}
								className="w-full sm:w-auto"
							>
								<Button
									size="lg"
									className="bg-gray-900 text-white hover:bg-gray-800 w-full sm:w-auto"
									asChild
								>
									<a
										href="http://wa.me/77079201320?text=Здравствуйте%2C%20хочу%20узнать%20подробнее"
										target="_blank"
										rel="noopener noreferrer"
									>
										Попробовать бесплатно
									</a>
								</Button>
							</motion.div>
							<motion.div
								variants={{ ...VARIANTS }}
								initial="hidden"
								animate="visible"
								transition={{ duration: 0.5, delay: 0.65 }}
								className="w-full sm:w-auto"
							>
								<Button
									size="lg"
									variant="outline"
									className="border-gray-300 hover:border-gray-400 w-full sm:w-auto"
									asChild
								>
									<a
										href="http://wa.me/77079201320?text=Здравствуйте%2C%20хочу%20узнать%20подробнее"
										target="_blank"
										rel="noopener noreferrer"
									>
										Узнать больше <ArrowRight className="ml-2 h-4 w-4" />
									</a>
								</Button>
							</motion.div>
						</div>
					</div>
					<div className="mt-16">
						<div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-lg overflow-hidden">
							<div className="relative w-full">
								<motion.div
									className="relative h-full w-full overflow-hidden rounded-lg flex items-center justify-center min-h-[300px] sm:min-h-[600px] lg:min-h-[800px]"
									variants={{ ...VARIANTS }}
									initial="hidden"
									animate="visible"
									transition={{ duration: 0.5, delay: 0.7 }}
								>
									<AnimatePresence initial={false}>
										<motion.img
											key={idx}
											src={images[idx]}
											alt="Скриншот интерфейса Infobuh"
											className="absolute inset-0 w-full h-full max-w-full max-h-[400px] sm:max-h-[800px] lg:max-h-[1000px] object-contain m-auto"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.6, ease: "easeInOut" }}
										/>
									</AnimatePresence>
								</motion.div>
							</div>
							<div
								className="absolute inset-x-0 -bottom-0 -mx-10 h-2/4 bg-gradient-to-t from-white via-white to-transparent"
								aria-hidden="true"
							></div>
						</div>
					</div>
				</div>
			</section>

			{/* How it Works Section */}
			<section id="how" className="px-4 py-12">
				<div className="container mx-auto max-w-5xl">
					<div className="text-center mb-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-4 sm:text-4xl">
							Как это работает
						</h2>
						<p className="text-gray-600 text-lg">
							Три шага - и документы готовы.
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.1 }}
							className="relative p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
						>
							<div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold mb-4">
								1
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Создайте сделку за два клика
							</h3>
							<p className="text-gray-600">
								Реквизиты, товары и ставки подтягиваются автоматически.
							</p>
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className="relative p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
						>
							<div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold mb-4">
								2
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Подписывайте и отправляйте
							</h3>
							<p className="text-gray-600">
								ЭЦП в приложении, PDF за секунды, отправка в WhatsApp и на
								почту.
							</p>
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className="relative p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
						>
							<div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold mb-4">
								3
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Хранение и контроль
							</h3>
							<p className="text-gray-600">
								В сделке — документы, проводки, оплаты и история в одном месте.
							</p>
						</motion.div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="px-4 py-24 sm:py-40">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-12">
						<h2 className="text-2xl font-bold text-gray-900 mb-3 sm:text-4xl">
							Возможности платформы
						</h2>
						<p className="text-gray-600 text-base max-w-2xl mx-auto">
							Все необходимые инструменты для эффективной работы с бухгалтерией
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
						{[
							{
								title: "Документы и сделки",
								description:
									"Создавайте первичные документы в три клика. Счета, акты, накладные — все в одном месте.",
							},
							{
								title: "Финансовый контроль",
								description:
									"Отслеживайте движение денег, балансы по счетам и проводки в режиме реального времени.",
							},
							{
								title: "База контрагентов",
								description:
									"Импортируйте данные из госреестра, храните историю взаимодействий и документов.",
							},
							{
								title: "Управление персоналом",
								description:
									"Ведите учет сотрудников, контролируйте начисления и договоры в единой системе.",
							},
							{
								title: "Налоговый учет",
								description:
									"Встроенные калькуляторы НДС, ИПН и других налогов по актуальному законодательству.",
							},
							{
								title: "Аналитика и отчеты",
								description:
									"Финансовые отчеты, ОСВ и аналитические дашборды для принятия решений.",
							},
							{
								title: "Мобильный доступ",
								description:
									"Полноценная работа с любого устройства без установки дополнительных программ.",
							},
							{
								title: "Интеграции",
								description:
									"API для связи с банками, ЭЦП, мессенджерами и другими сервисами.",
							},
						].map((feature, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.05 }}
								className="group"
							>
								<div className="p-6 rounded-lg border-gray-200 border hover:bg-gray-100 transition-colors">
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										{feature.title}
									</h3>
									<p className="text-gray-600 leading-relaxed">
										{feature.description}
									</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Numbers Section with Animated Numbers */}
			<Stats1 />

			{/* Pricing Section */}
			<section id="pricing" className="px-4 py-24  ">
				<div className="container mx-auto max-w-5xl">
					<div className="text-center mb-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-4 sm:text-4xl">
							Тарифы
						</h2>
						<p className="text-gray-600 text-lg">Выберите подходящий план</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.1 }}
							className="p-8 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
						>
							<h3 className="text-xl font-semibold text-gray-900 mb-4">
								Старт
							</h3>
							<div className="text-3xl font-bold text-gray-900 mb-2">0 тг</div>
							<p className="text-gray-600 mb-6">
								Создание первичных документов
							</p>
							<Button className="w-full" variant="outline" size="lg">
								Начать
							</Button>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className="p-8 rounded-2xl border-2 border-gray-900 bg-white shadow-xl relative"
						>
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-full text-sm">
								Популярный
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-4">
								Бизнес
							</h3>
							<div className="text-3xl font-bold text-gray-900 mb-2">
								10 000 тг
								<span className="text-lg font-normal text-gray-600">/мес</span>
							</div>
							<p className="text-gray-600 mb-6">Все обновления включены</p>
							<Button
								className="w-full bg-gray-900 hover:bg-gray-800"
								size="lg"
							>
								Оформить
							</Button>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className="p-8 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-shadow"
						>
							<h3 className="text-xl font-semibold text-gray-900 mb-4">
								Enterprise
							</h3>
							<div className="text-3xl font-bold text-gray-900 mb-2">
								Индивидуально
							</div>
							<p className="text-gray-600 mb-6">
								Роли, API, SSO и приоритетная поддержка
							</p>
							<Button className="w-full" variant="outline" size="lg">
								Связаться
							</Button>
						</motion.div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="px-4 py-12 sm:py-16">
				<div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 px-4">
					<div className="flex flex-col items-center gap-4 text-center">
						<span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm leading-normal text-gray-700">
							Начните бесплатно
						</span>
						<div className="flex flex-col gap-2">
							<h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
								Готовы начать?
							</h2>
							<p className="text-gray-600">
								Присоединяйтесь к сотням компаний, которые уже автоматизировали
								свою бухгалтерию
							</p>
						</div>
					</div>
					<div className="flex flex-col gap-4 w-full">
						<div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
							<Button
								size="lg"
								className="bg-gray-900 text-white hover:bg-gray-800 w-full sm:w-auto"
								asChild
							>
								<a
									href="http://wa.me/77079201320?text=Здравствуйте%2C%20хочу%20узнать%20подробнее"
									target="_blank"
									rel="noopener noreferrer"
								>
									Попробовать бесплатно
								</a>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="border-gray-300 hover:border-gray-400 w-full sm:w-auto"
							>
								Демо <ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
						<p className="text-center text-sm text-gray-500">
							Кредитная карта не требуется
						</p>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-gray-200 bg-white">
				<div className="container mx-auto max-w-screen-lg px-4 py-8">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<span className="text-sm text-gray-600">
							© {new Date().getFullYear()} Infobuh. Все права защищены.
						</span>
						<div className="flex gap-6">
							<Link
								to="/privacy-policy"
								className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
							>
								Конфиденциальность
							</Link>
							<Link
								to="/legal"
								className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
							>
								Условия
							</Link>
							<a
								href="#contacts"
								className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
							>
								Контакты
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
