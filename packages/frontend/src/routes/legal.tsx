import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/legal')({
    component: LegalPage,
})

function LegalPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-200">
                    <CardContent className="p-8 md:p-12">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
                                Пользовательское соглашение
                            </h1>
                            <p className="text-lg text-neutral-600 font-light">TOO 'INFO BUH' БИН 250240008548</p>
                        </div>

                        <Separator className="mb-8" />

                        {/* Preamble/Introduction */}
                        <div className="prose prose-neutral max-w-none mb-8">
                            <p className="text-neutral-700 leading-relaxed text-base">
                                Настоящее Пользовательское соглашение (далее — «Соглашение») является публичной офертой в соответствии со ст. 395 Гражданского кодекса Республики Казахстан и регулирует отношения между:
                            </p>
                            <p className="text-neutral-700 leading-relaxed text-base mt-2">
                                Оператором — TOO 'INFO BUH', БИН 250240008548, местонахождение: Г. АСТАНА, РАЙОН ЕСИЛЬ, именуемым также «Компания», и
                            </p>
                            <p className="text-neutral-700 leading-relaxed text-base mt-2">
                                Пользователем — физическим или юридическим лицом, принявшим условия Соглашения путем регистрации в мобильном и/или веб‑приложении «Infobuh».
                            </p>
                            <p className="text-neutral-700 leading-relaxed text-base mt-4">
                                Получая доступ к Сервису, Пользователь подтверждает, что ознакомился с условиями, принимает их в полном объёме без каких‑либо оговорок и обязуется их соблюдать.
                            </p>
                        </div>

                        {/* Section 1 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                1. Определения
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">Сервис / Приложение</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Облачная платформа «Infobuh» (мобильное и веб‑приложения), предназначенная для создания, обмена, подписания и хранения электронных документов бухгалтерского и управленческого учёта.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">Электронный документ</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Цифровая форма документа, созданная и/или загруженная Пользователем в Сервис.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">ЭЦП / CMS‑подпись</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Электронная цифровая подпись, соответствующая Закону РК «Об электронном документе и электронной цифровой подписи».
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">Личный кабинет</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Защищённая область Сервиса, доступная после аутентификации Пользователя.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-800 mb-2">Контрагент</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Третье лицо, с которым Пользователь обменивается Электронными документами в рамках Сервиса.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                2. Предмет соглашения
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                2.1. Компания предоставляет Пользователю невозмездный (если иное не указано в тарифном плане) неисключительный, непередаваемый доступ к функционалу Сервиса.
                            </p>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                2.2. Пользователь вправе:
                            </p>
                            <ul className="list-disc list-inside text-neutral-700 leading-relaxed ml-4 mb-2">
                                <li>создавать, редактировать и хранить Электронные документы;</li>
                                <li>подписывать документы собственной ЭЦП и/или запрашивать подпись Контрагента;</li>
                                <li>использовать API и иные интеграции, если таковые доступны.</li>
                            </ul>
                            <p className="text-neutral-700 leading-relaxed">
                                2.3. Компания обеспечивает круглосуточную доступность Сервиса (за исключением регламентных работ, форс‑мажора и сбоев сетей третьих лиц).
                            </p>
                        </section>

                        {/* Section 3 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                3. Регистрация пользователя
                            </h2>
                            <p className="text-neutral-700 leading-relaxed">
                                3.1. Для доступа к Сервису Пользователь проходит регистрацию, указывая достоверные данные (ФИО, e‑mail, телефон). Компания вправе запросить подтверждающие документы.
                            </p>
                        </section>

                        {/* Section 4 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                4. Регистрация и валидация юридического лица
                            </h2>
                            <p className="text-neutral-700 leading-relaxed">
                                4.1. Для доступа к полному Сервису Пользователь проходит регистрацию юридического лица, валидируя через ЭЦП-ключ и указывая достоверные данные (БИН/ИИН юридического лица, наименование, адрес, контактный телефон, дату регистрации, ОКЭД, УГД).
                            </p>
                        </section>

                        {/* Section 5 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                5. Электронные документы и подпись
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                5.1. Электронные документы, подписанные ЭЦП, имеют юридическую силу, равную документам на бумажном носителе, согласно законодательству РК.
                            </p>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                5.2. Хранение ЭЦП (PKCS#12) локально на устройстве осуществляется Пользователем. Компания не хранит пароли к ключевым файлам.
                            </p>
                            <p className="text-neutral-700 leading-relaxed">
                                5.3. Проверка подлинности CMS‑подписи выполняется через API ГУ «НИТ» либо собственный модуль валидации.
                            </p>
                        </section>

                        {/* Section 6 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                6. Права и обязанности Пользователя
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">Пользователь обязуется:</p>
                            <ul className="list-disc list-inside text-neutral-700 leading-relaxed ml-4 mb-2">
                                <li>соблюдать законодательство РК, в том числе налоговое, валютное, о персональных данных (Закон «О персональных данных и их защите»)</li>
                                <li>не загружать в Сервис материалы, нарушающие права третьих лиц или содержащие вредоносный код;</li>
                                <li>незамедлительно сообщать о несанкционированном доступе.</li>
                            </ul>
                            <p className="text-neutral-700 leading-relaxed">
                                Пользователь вправе обращаться в службу поддержки support@infobuh.kz по любым вопросам работы Сервиса.
                            </p>
                        </section>

                        {/* Section 7 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                7. Права и обязанности Компании
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">Компания обязуется:</p>
                            <ul className="list-disc list-inside text-neutral-700 leading-relaxed ml-4 mb-2">
                                <li>обеспечивать сохранность данных Пользователя, применяя сертифицированные средства защиты;</li>
                                <li>не раскрывать конфиденциальную информацию без согласия Пользователя, за исключением требований закона или суда;</li>
                                <li>уведомлять Пользователя об изменениях Соглашения не позднее, чем за 7 (семь) календарных дней до вступления изменений в силу.</li>
                            </ul>
                            <p className="text-neutral-700 leading-relaxed mb-2">Компания вправе:</p>
                            <ul className="list-disc list-inside text-neutral-700 leading-relaxed ml-4 mb-2">
                                <li>приостановить доступ в случае нарушения Пользователем законодательства или настоящего Соглашения;</li>
                                <li>модернизировать Сервис, изменяя функционал без предварительного уведомления, если это не ухудшает существенные условия.</li>
                            </ul>
                        </section>

                        {/* Section 8 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                8. Персональные данные и конфиденциальность
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                8.1. Компания обрабатывает персональные данные в соответствии с Политикой конфиденциальности, размещённой в Приложении.
                            </p>
                            <p className="text-neutral-700 leading-relaxed">
                                8.2. Передавая данные третьих лиц (контрагентов, сотрудников) Пользователь гарантирует наличие законного основания на такую передачу.
                            </p>
                        </section>

                        {/* Section 9 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                9. Тарифы и расчёты
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                9.1. Базовый функционал может предоставляться бесплатно. Премиальные функции доступны по подписке согласно Тарифам, размещённым в Приложении.
                            </p>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                9.2. Оплата подписки производится банковской картой через платёжного провайдера. Все расчёты в тенге (KZT), НДС включён (если применимо).
                            </p>
                            <p className="text-neutral-700 leading-relaxed">
                                9.3. В случае просрочки оплаты Компания вправе ограничить доступ к платным функциям.
                            </p>
                        </section>

                        {/* Section 10 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                10. Интеллектуальная собственность
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                10.1. Все исключительные права на Сервис, включая код, дизайн и базы данных, принадлежат Компании.
                            </p>
                            <p className="text-neutral-700 leading-relaxed">
                                10.2. Пользователь не вправе копировать, декомпилировать, модифицировать Сервис либо использовать элементы бренда без письменного согласия Компании.
                            </p>
                        </section>

                        {/* Section 11 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                11. Ограничение ответственности
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                11.1. Сервис предоставляется «как есть». Компания не гарантирует абсолютную бесперебойность или отсутствие ошибок.
                            </p>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                11.2. Компания не несёт ответственности за убытки, возникшие в результате:
                            </p>
                            <ul className="list-disc list-inside text-neutral-700 leading-relaxed ml-4 mb-2">
                                <li>некорректных данных, введённых Пользователем;</li>
                                <li>действий/бездействия Контрагентов;</li>
                                <li>сбоев оборудования или ПО третьих лиц.</li>
                            </ul>
                            <p className="text-neutral-700 leading-relaxed">
                                11.3. Совокупная ответственность Компании ограничивается суммой фактически уплаченной Пользователем подписки за последние 6 месяцев.
                            </p>
                        </section>

                        {/* Section 12 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                12. Срок действия и расторжение
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                12.1. Соглашение действует с момента акцепта и до его расторжения.
                            </p>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                12.2. Пользователь может удалить учётную запись в любое время через Личный кабинет. Все активные документы и данные будут удалены через 30 дней, если иное не требуется по закону.
                            </p>
                            <p className="text-neutral-700 leading-relaxed">
                                12.3. Компания вправе расторгнуть Соглашение в одностороннем порядке при существенном нарушении Пользователем условий.
                            </p>
                        </section>

                        {/* Section 13 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                13. Применимое право и разрешение споров
                            </h2>
                            <p className="text-neutral-700 leading-relaxed mb-2">
                                13.1. Настоящее Соглашение регулируется законодательством Республики Казахстан.
                            </p>
                            <p className="text-neutral-700 leading-relaxed">
                                13.2. Споры подлежат досудебному урегулированию (срок ответа — 10 рабочих дней). При недостижении согласия спор передаётся в специализированный межрайонный экономический суд г. Алматы.
                            </p>
                        </section>

                        {/* Section 14 */}
                        <section className="mb-10">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6 border-b border-neutral-200 pb-2">
                                14. Изменения Соглашения
                            </h2>
                            <p className="text-neutral-700 leading-relaxed">
                                Компания вправе изменять условия, публикуя новую редакцию в Приложении. Если Пользователь продолжает использовать Сервис после вступления изменений в силу, это считается акцептом новой редакции.
                            </p>
                        </section>

                        {/* Contact Section */}
                        <section className="mt-12 pt-8 border-t border-neutral-200">
                            <h2 className="text-2xl font-medium text-neutral-900 mb-6">15. Контакты</h2>
                            <div className="bg-neutral-50 p-6 rounded-lg">
                                <div className="space-y-2 text-neutral-700">
                                    <p>
                                        <span className="font-medium">Оператор:</span> TOO 'INFO BUH', БИН 250240008548
                                    </p>
                                    <p>
                                        <span className="font-medium">Адрес:</span> Г. АСТАНА, ЕСИЛЬСКИЙ РАЙОН
                                    </p>
                                    <p>
                                        <span className="font-medium">E-mail:</span> support@infobuh.kz
                                    </p>
                                </div>
                            </div>
                            <p className="text-neutral-600 text-sm mt-6 italic">
                                Продолжая пользоваться Сервисом, вы подтверждаете ознакомление и согласие с настоящим Пользовательским соглашением.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
