import React, { useState } from 'react'
import './index.css'

import generatedeal1 from '@/assets/landing/generatedeal1.png'
import generatedeal2 from '@/assets/landing/generatedeal2.png'
import generatedeal3 from '@/assets/landing/generatedeal3.png'

import deal1 from '@/assets/landing/deal1.png'
import deal2 from '@/assets/landing/deal2.png'
import deal3 from '@/assets/landing/deal3.png'

import doc1 from '@/assets/landing/doc1.png'
import doc2 from '@/assets/landing/doc2.png'

import onec1 from '@/assets/landing/onec1.png'
import onec2 from '@/assets/landing/onec2.png'

type GroupConfig = {
  images: string[]
  title: string
  text: string
}

const groups: GroupConfig[] = [
  {
    images: [generatedeal1, generatedeal2, generatedeal3],
    title: 'Создание сделки за 30 секунд',
    text: 'Вы выбираете контрагента и товар.\n\n Все реквизиты, данные получателя и ваша информация подтягиваются автоматически.',
  },
  {
    images: [deal1, deal2, deal3, doc1, doc2],
    title: 'Все в одном месте',
    text: 'Документы, подписи, проводки и оплаты — не в разных сервисах, а в одном приложении. Вы всегда видите, кто оплатил, кто должен и где зависли деньги.',
  },
  {
    images: [onec1, onec2],
    title: '1С интеграция',
    text: 'Загружайте счет, акт, накладную и проводки в 1С своей компании одной кнопкой. Infobuh выступит идеальным дополнением для вашей 1С.',
  },
]

function DealsShowcase() {
  return (
    <section className="deals-row">
      {groups.map((group, idx) => (
        <DealCard key={idx} {...group} />
      ))}
    </section>
  )
}

function DealCard({ images, title, text }: GroupConfig) {
  const [index, setIndex] = useState(0)

  const hasMultiple = images.length > 1
  const progress = hasMultiple ? (index + 1) / images.length : 1

  const handlePrev = () => {
    if (index === 0) return
    setIndex(index - 1)
  }

  const handleNext = () => {
    if (index === images.length - 1) return
    setIndex(index + 1)
  }

  return (
    <div className="deal-card">
      <div className="deal-card-figure">
        <img
          src={images[index]}
          alt=""
          className="deal-card-image"
        />

        {hasMultiple && (
          <div className="deal-card-overlay">
            <div className="deal-card-indicator">
              <div
                className="deal-card-indicator-bar"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>

            <div className="deal-card-arrows">
              <button
                className="deal-card-arrow-btn"
                onClick={handlePrev}
                disabled={index === 0}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="deal-card-arrow-btn"
                onClick={handleNext}
                disabled={index === images.length - 1}
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="deal-card-content">
        <div className="deal-card-title">{title}</div>
        <div className="deal-card-text">{text}</div>
      </div>
    </div>
  )
}

export default DealsShowcase
