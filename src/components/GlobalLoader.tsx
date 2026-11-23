export default function GlobalLoader({ message }: { message: string }) {
  return (
    <main className="global-loader" role="status" aria-live="polite">
      <div className="global-loader__content">
        <div className="global-loader__visual" aria-hidden="true">
          <span className="global-loader__orbit">
            <span className="global-loader__orbit-dot" />
          </span>
          <span className="global-loader__badge">
            <svg
              className="global-loader__capsule"
              viewBox="0 0 64 64"
              fill="none"
            >
              <g transform="rotate(-45 30 25)">
                <g className="global-loader__capsule-half global-loader__capsule-half--left">
                  <path d="M30 16h-9a9 9 0 0 0 0 18h9z" />
                </g>
                <g className="global-loader__capsule-half global-loader__capsule-half--right">
                  <path d="M30 16h9a9 9 0 0 1 0 18h-9z" />
                </g>
                <path className="global-loader__seam" d="M30 16v18" />
                <g className="global-loader__powder">
                  <circle
                    className="global-loader__powder-dot global-loader__powder-dot--one"
                    cx="30"
                    cy="25"
                    r="4.5"
                  />
                  <circle
                    className="global-loader__powder-dot global-loader__powder-dot--two"
                    cx="30"
                    cy="25"
                    r="3.5"
                  />
                  <circle
                    className="global-loader__powder-dot global-loader__powder-dot--three"
                    cx="30"
                    cy="25"
                    r="3"
                  />
                  <circle
                    className="global-loader__powder-dot global-loader__powder-dot--four"
                    cx="30"
                    cy="25"
                    r="2.4"
                  />
                </g>
              </g>
            </svg>
          </span>
        </div>
        <div className="global-loader__copy">
          <p>{message}</p>
          <span className="global-loader__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </main>
  );
}
