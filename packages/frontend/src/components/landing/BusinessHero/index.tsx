import React from 'react'
import './index.css'
import mockup from '@/assets/landing/mockup.png'
import { redirectToStore } from '@/services/landing/redirectToStore'
import { getWhatsappLink } from '@/services/landing/whatsapp'

type BusinessHeroProps = {
  kicker?: string
  title: string
  subtitle?: string
}

const BusinessHero: React.FC<BusinessHeroProps> = ({
  kicker,
  title,
  subtitle,
}) => {
  return (
    <section className="business-hero">
      <div className="business-hero-inner">

        {/* Мобилка: макет сверху */}
        <div className="business-hero-mockup mobile-mockup">
          <div className="mockup-box">
            <img src={mockup} alt="Infobuh mockup" />
          </div>
        </div>

        {/* Текст */}
        <div className="business-hero-content">
          {kicker && <div className="business-hero-kicker">{kicker}</div>}

          <h1 className="business-hero-title">{title}</h1>

          {subtitle && (
            <p className="business-hero-subtitle">{subtitle}</p>
          )}

          {/* Кнопки — как у тебя было */}
          <div className="business-hero-buttons">
            <button className="hero-btn-outline-light" onClick={redirectToStore}>Скачать</button>
            <button className="hero-btn-filled-light" onClick={getWhatsappLink}>Связаться</button>
          </div>
        </div>

        {/* Десктоп: макет справа */}
        <div className="business-hero-mockup desktop-mockup">
          <div className="mockup-box">
            <img src={mockup} alt="Infobuh mockup" />
          </div>
        </div>

      </div>
    </section>
  )
}

export default BusinessHero
