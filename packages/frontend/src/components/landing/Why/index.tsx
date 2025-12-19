import React from 'react'
import './index.css'

type Props = {
  title: string
}

function WhyInfobuh({ title }: Props) {
  return (
    <section className="why-section">
      <div className="why-inner">
        <div className="why-label">ДЛЯ ВЛАДЕЛЬЦЕВ БИЗНЕСА</div>

        <div className="why-title">
          {title}
        </div>

        <div className="why-text">
          Infobuh показывает в реальном времени:
        </div>

        <div className="why-grid">
          <div className="why-card">где вы теряете деньги</div>
          <div className="why-card">кто задерживает оплаты</div>
          <div className="why-card">как законно экономить на налогах</div>
          <div className="why-card">какие сделки приносят прибыль</div>
          <div className="why-card">отправку реализации покупателям</div>
          <div className="why-card">акты сверок контрагентов без бухгалтера</div>
        </div>
      </div>
    </section>
  )
}

export default WhyInfobuh
