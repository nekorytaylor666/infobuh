import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
    component: PrivacyPolicy,
});

function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-200">
                    <CardContent className="p-8 md:p-12">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
                                Политика конфиденциальности
                            </h1>
                            <p className="text-lg text-neutral-600 font-light">TOO 'INFO BUH' БИН 250240008548</p>
                        </div>

                        <Separator className="mb-8" />

                        {/* Introduction */}
                        <div className="prose prose-neutral max-w-none mb-8">
                            <p className="text-neutral-700 leading-relaxed text-base">
                                Настоящая Политика конфиденциальности (далее — «Политика») описывает, как TOO 'INFO BUH' БИН
                                250240008548 (далее — «Компания», «мы», «нас», «наш») собирает, использует, раскрывает и хранит
                                Персональные данные Пользователей при использовании мобильного и веб‑приложений «Infobuh», а также
                                связанных сайтов и API (далее совместно — «Сервис»).
                            </p>
                            <p className="text-neutral-700 leading-relaxed text-base mt-4">
                                Присоединяясь к Пользовательскому соглашению и продолжая пользоваться Сервисом, Пользователь выражает
                                согласие с настоящей Политикой.
                            </p>
                        </div>

                        {/* Section 1 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                1. Термины и определения
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">Персональные данные</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Любая информация, относящаяся к прямо или косвенно определённому физическому лицу (субъекту данных)
                                        в понимании Закона РК «О персональных данных и их защите».
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">Обработка данных</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Любое действие с Персональными данными (сбор, запись, хранение, изменение, использование, передача,
                                        удаление и др.).
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">Cookies</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Небольшие текстовые файлы, которые сохраняются в браузере Пользователя и помогают идентифицировать
                                        его сессию.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">DPO</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Уполномоченное лицо по защите данных (Data Protection Officer) Компании.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                2. Категории собираемых данных
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-4">Мы можем собирать следующие категории данных:</p>
                            <div className="space-y-3">
                                <div className="flex">
                                    <span className="font-medium text-neutral-800 mr-2">1.</span>
                                    <div>
                                        <span className="font-medium text-neutral-800">Учётные данные</span>
                                        <span className="text-neutral-700"> — ФИО, e‑mail, телефон, пароль (хэш), роль в компании.</span>
                                    </div>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-neutral-800 mr-2">2.</span>
                                    <div>
                                        <span className="font-medium text-neutral-800">Данные юрлица</span>
                                        <span className="text-neutral-700">
                                            {" "}
                                            — БИН, наименование ТОО/ИП, юридический адрес, банковские реквизиты.
                                        </span>
                                    </div>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-neutral-800 mr-2">3.</span>
                                    <div>
                                        <span className="font-medium text-neutral-800">Документарные данные</span>
                                        <span className="text-neutral-700">
                                            {" "}
                                            — содержимое загружаемых файлов (PDF, XML, JPEG), метаданные документов, подписи CMS.
                                        </span>
                                    </div>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-neutral-800 mr-2">4.</span>
                                    <div>
                                        <span className="font-medium text-neutral-800">Транзакционные данные</span>
                                        <span className="text-neutral-700"> — история операций, платежей, тарифы.</span>
                                    </div>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-neutral-800 mr-2">5.</span>
                                    <div>
                                        <span className="font-medium text-neutral-800">Технические данные</span>
                                        <span className="text-neutral-700">
                                            {" "}
                                            — IP‑адрес, тип устройства, ОС, версия приложения, логи ошибок.
                                        </span>
                                    </div>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-neutral-800 mr-2">6.</span>
                                    <div>
                                        <span className="font-medium text-neutral-800">Данные Cookies и аналитики</span>
                                        <span className="text-neutral-700">
                                            {" "}
                                            — идентификаторы сеанса, referrer, время посещения, поведенческие события.
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-neutral-700 leading-relaxed mt-4">
                                Мы не собираем специальные категории данных (биометрия, здоровье) и нецелевых данных о детях до 13 лет.
                            </p>
                        </section>

                        {/* Section 3 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                3. Источники получения данных
                            </h2>
                            <ul className="space-y-2 text-neutral-700">
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Регистрационные формы и интерфейсы Сервиса.
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Интеграции API (например, автоматический импорт ЭЦП).
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Платёжные шлюзы и провайдеры (при оплате подписки).
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Cookies и пиксели аналитических систем (Google Analytics 4 / Yandex Metrica).
                                </li>
                            </ul>
                        </section>

                        {/* Section 4 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                4. Цели и правовые основания обработки
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200">
                                            <th className="text-left py-3 px-4 font-medium text-neutral-800">Цель</th>
                                            <th className="text-left py-3 px-4 font-medium text-neutral-800">Правовое основание</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-neutral-700">
                                        <tr className="border-b border-neutral-100">
                                            <td className="py-3 px-4">Регистрация и аутентификация пользователя</td>
                                            <td className="py-3 px-4">Договор (Пользовательское соглашение art. 387 ГК РК)</td>
                                        </tr>
                                        <tr className="border-b border-neutral-100">
                                            <td className="py-3 px-4">Предоставление и улучшение функционала Сервиса</td>
                                            <td className="py-3 px-4">Законные интересы Компании (ст. 6 Закона о ПД)</td>
                                        </tr>
                                        <tr className="border-b border-neutral-100">
                                            <td className="py-3 px-4">Выполнение бухгалтерских и налоговых обязательств</td>
                                            <td className="py-3 px-4">Требования законодательства РК</td>
                                        </tr>
                                        <tr className="border-b border-neutral-100">
                                            <td className="py-3 px-4">Маркетинговые рассылки и новости (e‑mail, пуш‑уведомления)</td>
                                            <td className="py-3 px-4">Согласие Пользователя</td>
                                        </tr>
                                        <tr className="border-b border-neutral-100">
                                            <td className="py-3 px-4">Подтверждение платежей и возвратов</td>
                                            <td className="py-3 px-4">Договор + обязательные требования НПА</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-4">Антифрод, безопасность и аудит</td>
                                            <td className="py-3 px-4">Законный интерес (предотвращение нарушений)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Remaining sections with similar styling... */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                5. Cookies и аналитика
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-4">Мы используем Cookies для:</p>
                            <ul className="space-y-2 text-neutral-700 mb-4">
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    сохранения пользовательских сессий,
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    персонализации интерфейса,
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    анализа поведения и улучшения продукта.
                                </li>
                            </ul>
                            <p className="text-neutral-700 leading-relaxed">
                                Управлять Cookies можно в настройках браузера; отключение может ограничить функционал.
                            </p>
                        </section>

                        {/* Section 6 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                6. Передача третьим лицам
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-4">Мы раскрываем данные только в объёме, необходимом для указанных целей:</p>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200">
                                            <th className="text-left py-3 px-4 font-medium text-neutral-800">Получатель</th>
                                            <th className="text-left py-3 px-4 font-medium text-neutral-800">Цель</th>
                                            <th className="text-left py-3 px-4 font-medium text-neutral-800">Защита</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-neutral-700">
                                        <tr className="border-b border-neutral-100">
                                            <td className="py-3 px-4">Платёжный провайдер (e.g., CloudPayments)</td>
                                            <td className="py-3 px-4">Обработка платежей</td>
                                            <td className="py-3 px-4">PCI DSS, HTTPS</td>
                                        </tr>
                                        <tr className="border-b border-neutral-100">
                                            <td className="py-3 px-4">Поставщики хостинга (e.g., Supabase, AWS)</td>
                                            <td className="py-3 px-4">Хранение и бэкап данных</td>
                                            <td className="py-3 px-4">ISO/IEC 27001, шифрование at‑rest</td>
                                        </tr>
                                        <tr className="border-b border-neutral-100">
                                            <td className="py-3 px-4">Государственные органы</td>
                                            <td className="py-3 px-4">Исполнение законных требований</td>
                                            <td className="py-3 px-4">Официальный запрос/суд</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-4">Подрядчики техподдержки</td>
                                            <td className="py-3 px-4">Диагностика ошибок</td>
                                            <td className="py-3 px-4">NDA, минимизация данных</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-neutral-700 leading-relaxed mt-4">
                                Мы не продаём персональные данные третьим лицам для маркетинговых целей.
                            </p>
                        </section>

                        {/* Section 7 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                7. Хранение и защита данных
                            </h2>
                            <ul className="space-y-2 text-neutral-700">
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Основные базы данных расположены в дата‑центрах внутри РК (Tier III).
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Шифрование: TLS 1.2/1.3 при передаче, AES‑256 at‑rest.
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Логи доступа хранятся 12 месяцев.
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Регулярные резервные копии с хранением 30 дней.
                                </li>
                            </ul>
                        </section>

                        {/* Section 8 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                8. Права субъектов данных
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-4">Пользователь вправе:</p>
                            <ul className="space-y-2 text-neutral-700">
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Получить информацию об обработке своих данных.
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Запросить исправление неточных данных.
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Отозвать согласие (в части, где оно является основанием).
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Потребовать удаление (если нет законных оснований для хранения).
                                </li>
                                <li className="flex items-start">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    Обратиться в уполномоченный орган по защите данных РК.
                                </li>
                            </ul>
                            <p className="text-neutral-700 leading-relaxed mt-4">
                                Запросы направляются на e‑mail DPO: privacy@infobuh.com.
                            </p>
                        </section>

                        {/* Section 9 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                9. Международные передачи
                            </h2>
                            <p className="text-neutral-700 leading-relaxed">
                                Если данные передаются на серверы за пределы РК (например, CDN Cloudflare), компания обеспечивает уровень защиты не ниже, чем предусмотрено законодательством РК. Мы используем стандартные договорные условия и другие механизмы для обеспечения адекватной защиты данных при трансграничной передаче.
                            </p>
                        </section>

                        {/* Section 10 - Placeholder for future "Изменения в Политике" */}
                        {/* You can add this section later if needed
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                10. Изменения в Политике
                            </h2>
                            <p className="text-neutral-700 leading-relaxed">
                                Мы можем обновлять эту Политику. Новая редакция вступает в силу с момента публикации на Сайте, если иное не указано. Рекомендуем регулярно проверять обновления.
                            </p>
                        </section>
                        */}

                        {/* Contact Section */}
                        <section className="mt-12 pt-8 border-t border-neutral-200">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6">11. Контакты</h2>
                            <div className="bg-neutral-50 p-6 rounded-lg">
                                <div className="space-y-2 text-neutral-700">
                                    <p>
                                        <span className="font-medium">Компания:</span> TOO 'INFO BUH' БИН 250240008548
                                    </p>
                                    <p>
                                        <span className="font-medium">E‑mail:</span> support@infobuh.com
                                    </p>
                                    <p>
                                        <span className="font-medium">DPO E-mail:</span> privacy@infobuh.com
                                    </p>
                                    <p>
                                        <span className="font-medium">Адрес:</span> Г. АСТАНА, ЕСИЛЬСКИЙ РАЙОН
                                    </p>
                                </div>
                            </div>
                            <p className="text-neutral-600 text-sm mt-6 italic">
                                Продолжая пользоваться Сервисом, вы подтверждаете ознакомление и согласие с настоящей Политикой.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
