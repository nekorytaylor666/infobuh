import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import "./landing/index.css";
import mockup1 from '@/assets/infobuhmockup1.png'
import mockup2 from '@/assets/infobuhmockup2.png'
import mockup3 from '@/assets/infobuhmockup3.png'
import mockup4 from '@/assets/infobuhmockup4.png'
import mockup5 from '@/assets/infobuhmockup5.png'
import mockup6 from '@/assets/infobuhmockup6.png'
import mockup7 from '@/assets/infobuhmockup7.png'

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const images = React.useMemo(
    () => [mockup1, mockup2, mockup3, mockup4, mockup5, mockup6, mockup7],
    []
  );
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, 1300);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="ld-page">
      <header className="ld-header">
        <div className="ld-wrap ld-header-row">
          <div className="ld-brand">
            <span className="ld-brand-text">Infobuh</span>
          </div>

          <nav className="ld-nav">
            <a className="ld-nav-link" href="#how">Как это работает</a>
            <a className="ld-nav-link" href="#features">Возможности</a>
            <a className="ld-nav-link" href="#pricing">Цены</a>
            <Button className="ld-cta" variant="default">Войти</Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="ld-hero">
          <div className="ld-wrap">
            <h1 className="ld-hero-title">
              Простая бухгалтерия для казахстанских бизнесов
            </h1>
            <p className="ld-hero-sub">
              Сокращает ручной труд в 10 раз. Автоматизирует 90% рутины
            </p>
            <div className="ld-hero-actions">
              <Button className="ld-action-primary" size="lg">Попробовать бесплатно</Button>
            </div>

            <div className="ld-mockup">
              <img
                className="ld-mockup-img"
                src={images[idx]}
                alt="Скриншот интерфейса Infobuh"
                loading="eager"
              />
            </div>
          </div>
        </section>

        <section id="how" className="ld-how">
          <div className="ld-wrap">
            <div className="ld-section-head">
              <h2 className="ld-h2">Как это работает</h2>
              <p className="ld-lead">Три шага - и документы готовы.</p>
            </div>

            <div className="ld-steps">
              <div className="ld-step">
                <div className="ld-step-num">1</div>
                <h3 className="ld-step-title">Создайте сделку за два клика</h3>
                <p className="ld-step-text">Реквизиты, товары и ставки подтягиваются автоматически.</p>
              </div>
              <div className="ld-step">
                <div className="ld-step-num">2</div>
                <h3 className="ld-step-title">Подписывайте и отправляйте</h3>
                <p className="ld-step-text">ЭЦП в приложении, PDF за секунды, отправка в WhatsApp и на почту.</p>
              </div>
              <div className="ld-step">
                <div className="ld-step-num">3</div>
                <h3 className="ld-step-title">Хранение и контроль</h3>
                <p className="ld-step-text">В сделке — документы, проводки, оплаты и история в одном месте.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="ld-features">
          <div className="ld-wrap">
            <div className="ld-section-head">
              <h2 className="ld-h2">Что внутри</h2>
              <p className="ld-lead">Только полезное. Ничего лишнего.</p>
            </div>

            <div className="ld-grid">
              <div className="ld-card">
                <h3 className="ld-card-title">Прямой доступ к данным</h3>
                <p className="ld-card-text">Понятный интерфейс с телефона. Без 1С и без ожиданий.</p>
              </div>
              <div className="ld-card">
                <h3 className="ld-card-title">Первичные документы</h3>
                <p className="ld-card-text">Создайте сделку с реализацией, счетом на оплату в три клика.</p>
              </div>
              <div className="ld-card">
                <h3 className="ld-card-title">Деньги и проводки</h3>
                <p className="ld-card-text">Синхронны со сделками и контрагентами. Балансы по счетам, ДДС. </p>
              </div>
              <div className="ld-card">
                <h3 className="ld-card-title">Акты сверок</h3>
                <p className="ld-card-text">Прямой доступ к актам сверок по сделкам и контрагентам.</p>
              </div>
              <div className="ld-card">
                <h3 className="ld-card-title">Контрагенты</h3>
                <p className="ld-card-text">Добавляйте контрагентов из госреестра в один клик.</p>
              </div>
              <div className="ld-card">
                <h3 className="ld-card-title">Сотрудники</h3>
                <p className="ld-card-text">Реестр сотрудников: контролируйте выдачу зарплат и договоры.</p>
              </div>
              <div className="ld-card">
                <h3 className="ld-card-title">Планирование налогов</h3>
                <p className="ld-card-text">Калькуляторы НДС, ИПН, транспортного и др. По законодательству.</p>
              </div>
              <div className="ld-card">
                <h3 className="ld-card-title">Отчеты без боли</h3>
                <p className="ld-card-text">Легкие фин. отчеты и ОСВ. Все на одном экране.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ld-numbers">
          <div className="ld-wrap ld-numbers-row">
            <div className="ld-number">
              <div className="ld-number-value">80 сек</div>
              <div className="ld-number-label">на создание сделки</div>
            </div>
            <div className="ld-number">
              <div className="ld-number-value">–10×</div>
              <div className="ld-number-label">ручного труда</div>
            </div>
            <div className="ld-number">
              <div className="ld-number-value">300+</div>
              <div className="ld-number-label">компаний уже с нами</div>
            </div>
          </div>
        </section>

        <section id="pricing" className="ld-pricing">
          <div className="ld-wrap ld-pricing-box">
            <div className="ld-pricing-col">
              <h3 className="ld-pricing-title">Старт</h3>
              <div className="ld-price">0 тг</div>
              <p className="ld-pricing-note">Создание первичных документов</p>
              <Button className="ld-pricing-btn" size="lg">Начать</Button>
            </div>
            <div className="ld-pricing-col ld-pricing-col--accent">
              <h3 className="ld-pricing-title">Бизнес</h3>
              <div className="ld-price">10 000 тг/мес</div>
              <p className="ld-pricing-note">Все обновления включены</p>
              <Button className="ld-pricing-btn" size="lg">Оформить</Button>
            </div>
            <div className="ld-pricing-col">
              <h3 className="ld-pricing-title">Enterprise</h3>
              <div className="ld-price">Индивидуально</div>
              <p className="ld-pricing-note">Роли, API, SSO и приоритетная поддержка</p>
              <Button className="ld-pricing-btn" size="lg" variant="outline">Связаться</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="ld-footer">
        <div className="ld-wrap ld-footer-row">
          <span className="ld-footer-copy">© {new Date().getFullYear()} Infobuh</span>
          <div className="ld-footer-links">
            <a className="ld-footer-link" href="#privacy">Конфиденциальность</a>
            <a className="ld-footer-link" href="#terms">Условия</a>
            <a className="ld-footer-link" href="#contacts">Контакты</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
