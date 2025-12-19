import React from 'react'
import './index.css'

type NicheBenefitsProps = {
  labels?: string[]

  problems: string[]
}

function NicheBenefits({
  labels = [],
  problems,
}: NicheBenefitsProps) {
  const hasLabels = labels.length > 0

  return (
    <section className="ps-section">
      <div className="ps-inner">
        {hasLabels && (
          <div className="ps-labels">
            {labels.map((label) => (
              <span key={label} className="ps-label">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="ps-layout">
          <div className="ps-column ps-column--problems">
            <ul className="ps-list">
              {problems.map((p, i) => (
                <li key={i} className="ps-list-item">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h3 className="ps-title">Infobuh решит все боли бухгалтерии.</h3>
      </div>
    </section>
  )
}

export default NicheBenefits
