import React, { useEffect, useState } from 'react'
import './index.css'
import logoWhite from '@/assets/landing/logo-white.png'
import logoBlack from '@/assets/landing/logo-black.png'
import { useNavigate } from '@tanstack/react-router'
import { getWhatsappLink } from '@/services/landing/whatsapp'
import { redirectToStore } from '@/services/landing/redirectToStore'

type HeaderProps = {
  forceLight?: boolean // ФЛАГ
}

const Header: React.FC<HeaderProps> = ({ forceLight = false }) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (forceLight) return

    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [forceLight])

  const isSolid = forceLight || scrolled || menuOpen
  const isLightText = !isSolid

  const logoSrc = isSolid ? logoBlack : logoWhite

  const navigate = useNavigate()

  return (
    <>
      <header
        className={
          'header ' + (isSolid ? 'header--solid' : 'header--transparent')
        }
      >
        <div className="header-inner">
          <div className="header-left">
            <a href="/" className="header-logo">
              <img src={logoSrc} alt="Infobuh" />
            </a>

            <nav className="header-nav">
              <div
                onClick={() => navigate({ to: '/businesses' })}
                className={'header-link ' + (isLightText ? 'header-link--light' : 'header-link--dark')}
              >
                Бизнесы
              </div>
              <a
                href="#solutions"
                className={'header-link ' + (isLightText ? 'header-link--light' : 'header-link--dark')}
              >
                Решения
              </a>
              <a
                href="#pricing"
                className={'header-link ' + (isLightText ? 'header-link--light' : 'header-link--dark')}
              >
                Цена
              </a>
            </nav>
          </div>

          <div className="header-right">
            <button
              className={
                'header-link header-link-button ' +
                (isLightText ? 'header-link--light' : 'header-link--dark')
              }
              onClick={redirectToStore}
            >
              Начать
            </button>
            <button
              className={
                'header-link header-link-button ' +
                (isLightText ? 'header-link--light' : 'header-link--dark')
              }
              onClick={getWhatsappLink}
            >
              Связаться
            </button>

            <button
              className={
                'burger ' +
                (menuOpen ? 'burger--open ' : '') +
                (isLightText ? 'burger--light' : 'burger--dark')
              }
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={'mobile-menu ' + (menuOpen ? 'mobile-menu--open' : '')}>
        <nav className="mobile-menu-inner">
          <a
            className="mobile-link"
            onClick={() => navigate({ to: '/businesses' })}
          >
            Бизнесы
          </a>
          <a
            href="#solutions"
            className="mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            Решения
          </a>
          <a
            href="#pricing"
            className="mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            Цена
          </a>

          <div className="mobile-actions">
            <button
              className="mobile-link mobile-link-button"
              onClick={redirectToStore}
            >
              Начать
            </button>
            <button
              className="mobile-link mobile-link-button"
              onClick={getWhatsappLink}
            >
              Связаться
            </button>
          </div>
        </nav>
      </div>
    </>
  )
}

export default Header
