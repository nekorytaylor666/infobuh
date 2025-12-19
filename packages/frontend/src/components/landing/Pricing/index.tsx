import React from 'react'
import './index.css'
import { redirectToStore } from '@/services/landing/redirectToStore'
import { getWhatsappLink } from '@/services/landing/whatsapp'

type Plan = {
  name: string
  price: string
  features: string[]
  cta: string
}

type Extra = {
  title: string
  subtitle: string
  text: string
  cta: string
}

const plans: Plan[] = [
  {
    name: 'FREE',
    price: '0 ₸ / мес.',
    features: [
      '- Весь ЭДО',
      '- Создание документов',
      '- Отправка контрагенту',
      '- ЭЦП подпись',
      '- Проводки по ЭДО',
    ],
    cta: 'Скачать',
  },
  {
    name: 'BASIC',
    price: '10 000 ₸ / мес.',
    features: [
      '- ЭЦП подпись через Face ID',
      '- Акт сверки по контрагентам',
      '- Отчет для ИП упрощенки 910.00',
      '- Отчет для ИП розничной торговли 913.00',
    ],
    cta: 'Приобрести',
  },
  {
    name: 'PREMIUM',
    price: '20 000 ₸ / мес.',
    features: [
      '- Доступ к ЭСФ и СНТ в приложении',
      '- Отчеты 100.00, 200.00, 300.00',
      '- Вся касса',
      '- Все другие услуги',
    ],
    cta: 'Приобрести',
  },
]

const extras: Extra[] = [
  {
    title: '1С интеграция',
    subtitle: '120 000 ₸ / разово',
    text: 'Подключается за 15 минут и работает стабильно без сбоев. Передавайте реализации из Infobuh в 1С и обратно в один клик без ручных выгрузок, файлов и ошибок.',
    cta: 'Связаться',
  },
]

function Pricing() {
  return (
    <section className="pricing-section">
      <div className="pricing-inner">
        <div className="pricing-price">Цены и тарифы</div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className="pricing-card">
              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price">{plan.price}</div>
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button className="pricing-button" onClick={getWhatsappLink}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>


        <div className="pricing-extra-grid">
          {extras.map((extra) => (
            <div key={extra.title} className="pricing-extra-card">
              <div className="pricing-extra-header">
                <div className="pricing-extra-name">{extra.title}</div>
                <div className="pricing-extra-price">{extra.subtitle}</div>
              </div>
              <div className="pricing-extra-text">
                {extra.text}
              </div>
              <button className="pricing-extra-button" onClick={getWhatsappLink}>
                {extra.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
