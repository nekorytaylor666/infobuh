import React from 'react'
import './index.css'

import logoWhite from '@/assets/landing/logo-white.png'
import { redirectToStore } from '@/services/landing/redirectToStore'
import { getWhatsappLink } from '@/services/landing/whatsapp'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-cta">
          <div className="footer-cta-title">
            Попробуйте Infobuh бесплатно уже сейчас
          </div>

          <div className="footer-buttons">
            <button className="footer-btn footer-btn-outline" onClick={redirectToStore}>
              Скачать
            </button>
            <button className="footer-btn footer-btn-filled" onClick={() => getWhatsappLink()}>
              Связаться
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <img src={logoWhite} className="footer-logo" />

          <div className="footer-links">
            <a onClick={() => {window.open("https://infobuh.com/privacy-policy", "_blank");}}>Конфиденциальность</a>
            <a onClick={() => {window.open("https://infobuh.com/legal", "_blank");}}>Условия</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
