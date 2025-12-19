import React from 'react'
import './index.css'
import badges from '@/assets/landing/badges.png'
import { redirectToStore } from '@/services/landing/redirectToStore'
import { getWhatsappLink } from '@/services/landing/whatsapp'

function StartNow() {
  return (
    <section className="startnow">
      <div className="startnow-inner">
        <img src={badges} className='startnow-img'/>
        <h2 className="startnow-title">
          Передайте всю бухгалтерию в Infobuh
        </h2>

        <p className="startnow-sub">
          Установите приложение бесплатно и забудьте о бухгалтерской рутине.
        </p>

        <div className="startnow-stores">
          <a
            onClick={redirectToStore}
            className="startnow-store-btn"
          >
            Установить
          </a>
        </div>

        <div className="startnow-help">
          <div className="startnow-help-text">
            Если бухгалтерия всё ещё пугает - напишите нам в WhatsApp. Наши специалисты подскажут и помогут со всеми вопросами.
          </div>

          <a
            onClick={getWhatsappLink}
            className="startnow-whatsapp-btn"
          >
            Написать в WhatsApp
          </a>

          <div className="startnow-help-text" style={{marginTop: 10}}>
            Среднее время ответа - 3 минуты
          </div>
        </div>
      </div>
    </section>
  )
}

export default StartNow
