import React, { useState } from 'react'
import './index.css'

import kassa from '@/assets/landing/kassa.png'
import sotrudnik from '@/assets/landing/sotrudnik.png'
import tax from '@/assets/landing/tax.png'
import freelancer6 from '@/assets/landing/freelancer6.png'
import freelancer7 from '@/assets/landing/freelancer7.png'
import freelancer8 from '@/assets/landing/freelancer8.png'

type Item = {
  title: string
  text: string
  image: string
}

const items: Item[] = [
  {
    title: 'Налоговые отчеты',
    text: 'Собирайте автоматически отчеты по 910, 913, 100, 200, 300 форме. Приложение уведомит вас перед датой сдачи отчетов и выплаты налогов.',
    image: freelancer6,
  },
  {
    title: 'Уведомления',
    text: 'Получайте напоминания о сроках налогов. Перед сдачей отчёта и оплатой налога приходят уведомления.',
    image: freelancer8,
  },
  {
    title: 'Ведите кассу',
    text: 'Список ваших должников, баланс по счетам, зарплатный фонд, проводки по реализации, доходность за период и другое.',
    image: kassa,
  },
  {
    title: 'Управляйте сотрудниками',
    text: 'Начисляйте зарплаты, считайте соц.отчисления, храните кадровые документы в одном месте.',
    image: sotrudnik,
  },
]

function OtherFutures() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)
  const currentImage = items[activeIndex ?? 0].image

  const handleToggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="comfort-section">
      <div className="comfort-left">
        <div className="second-text" style={{ fontSize: 13 }}>
          ДРУГИЕ УДОБСТВА
        </div>
        <div className="second-title">Управляйте бизнесом через телефон</div>

        <div className="comfort-accordion">
          {items.map((item, index) => {
            const open = activeIndex === index
            return (
              <div key={index} className="comfort-item">
                <button
                  className="comfort-header"
                  onClick={() => handleToggle(index)}
                >
                  <div className="comfort-header-title">{item.title}</div>
                  <div className="comfort-header-icon">
                    {open ? '−' : '+'}
                  </div>
                </button>
                {open && (
                  <div className="comfort-body">
                    <p className="comfort-body-text">{item.text}</p>
                    <div className="comfort-image-mobile">
                      <img src={item.image} alt="" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="comfort-right">
        <div className="comfort-image-desktop">
          <img src={currentImage} alt="" />
        </div>
      </div>
    </section>
  )
}

export default OtherFutures
