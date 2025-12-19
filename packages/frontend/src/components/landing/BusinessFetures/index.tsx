import React, { useState } from "react";

export type GroupConfig = {
  images: string[];
  title: string;
  text: string;
};

type DealsBusinessShowcaseProps = {
  groups: GroupConfig[];
  headerLabel: string;
  headerTitle: string;
};

function DealsBusinessShowcase({
  groups,
  headerLabel,
  headerTitle,
}: DealsBusinessShowcaseProps) {
  return (
    <>
      <div className="second" style={{paddingBottom: 10, paddingTop: 0}}>
        <div className="second-text" style={{ fontSize: 13 }}>
          {headerLabel}
        </div>
        <div className="second-title">{headerTitle}</div>
      </div>
      <section className="deals-row">
        {groups.map((group, idx) => (
          <DealCard key={idx} {...group} />
        ))}
      </section>
    </>
  );
}

function DealCard({ images, title, text }: GroupConfig) {
  const [index, setIndex] = useState(0);

  const hasMultiple = images.length > 1;
  const progress = hasMultiple ? (index + 1) / images.length : 1;

  const handlePrev = () => {
    if (index === 0) return;
    setIndex(index - 1);
  };

  const handleNext = () => {
    if (index === images.length - 1) return;
    setIndex(index + 1);
  };

  return (
    <div className="deal-card">
      <div className="deal-card-figure">
        <img src={images[index]} alt="" className="deal-card-image" />

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
  );
}

export default DealsBusinessShowcase;
