import React, { useState, useEffect } from "react";
import "./PortalSelection.css";
import { navigateTo } from "../../config/basePath";
import { isTokenValid } from "../../../components/common/PublicRoute";

function PortalSelection() {
  const [overlayActive, setOverlayActive] = useState(false);

  useEffect(() => {
    if (isTokenValid()) {
      navigateTo("/dashboard", true);
      return;
    }
    const canvas = document.getElementById("particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, pts = [], animId;

    const colors = [
      "rgba(26,79,196,",
      "rgba(14,124,90,",
      "rgba(201,125,26,",
      "rgba(201,168,76,",
    ];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function mk() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        col: colors[Math.floor(Math.random() * colors.length)],
        a: Math.random() * 0.4 + 0.08,
        life: 1,
        d: Math.random() * 0.0015 + 0.0008,
      };
    }

    for (let i = 0; i < 80; i++) pts.push(mk());

    function draw() {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.d;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + p.a * p.life + ")";
        ctx.fill();
        if (p.life <= 0) pts[i] = mk();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const navigate = (url) => {
    setOverlayActive(true);
    setTimeout(() => {
      navigateTo(url);
    }, 1200);
  };

  return (
    <div className="portal-selection">

      {/* Animated Background */}
      <div className="bg-scene">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="grid-overlay"></div>
        <div className="noise-overlay"></div>
        <canvas id="particles"></canvas>
      </div>

      {/* Header — Logo Only */}
      <header className="site-header">
        <div className="logo-wrap">
          <div className="logo-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" stroke="#C9A84C" strokeWidth="1.5"/>
              <path d="M12 28 L20 12 L28 28" stroke="#C9A84C" strokeWidth="2" fill="none"/>
              <path d="M15 22 L25 22" stroke="#C9A84C" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="logo-text"><span>M3</span> Group</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="eyebrow-tag">
            <span className="dot"></span>
            Secure Access Portal
          </div>
          <h1 className="hero-title">
            Welcome to <span className="title-highlight">Novo Nordisk</span>
          </h1>
          <p className="hero-subtitle">
            Select your division portal to continue to your workspace
          </p>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="cards-section">
        <div className="container">
          <div className="row g-4 justify-content-center">

            {/* North */}
            <div className="col-lg-4 col-md-6">
              <div className="portal-card card-north">
                <div className="card-inner">
                  <div className="card-badge">
                    <span className="badge-dot"></span>Division 01
                  </div>
                  <div className="card-icon-wrap">
                    <div className="card-icon">
                      <svg viewBox="0 0 48 48" fill="none">
                        <path d="M24 8 L40 36 H8 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                        <circle cx="24" cy="18" r="3" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                  <div className="card-compass">N</div>
                  <h2 className="card-title">M3 North</h2>
                  <button
                    className="portal-btn btn-north"
                    onClick={() => navigate("/login")}
                  >
                    <span>Enter Portal</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <div className="card-glow glow-north"></div>
              </div>
            </div>

            {/* South */}
            <div className="col-lg-4 col-md-6">
              <div className="portal-card card-south featured">
                <div className="featured-ring"></div>
                <div className="card-inner">
                  <div className="card-badge">
                    <span className="badge-dot"></span>Division 02
                  </div>
                  <div className="card-icon-wrap">
                    <div className="card-icon">
                      <svg viewBox="0 0 48 48" fill="none">
                        <path d="M24 40 L8 12 H40 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                        <circle cx="24" cy="30" r="3" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                  <div className="card-compass">S</div>
                  <h2 className="card-title">M3 South</h2>
                  <button
                    className="portal-btn btn-south"
                    onClick={() => navigate("/login")}
                  >
                    <span>Enter Portal</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <div className="card-glow glow-south"></div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="col-lg-4 col-md-6">
              <div className="portal-card card-infra">
                <div className="card-inner">
                  <div className="card-badge">
                    <span className="badge-dot"></span>Division 03
                  </div>
                  <div className="card-icon-wrap">
                    <div className="card-icon">
                      <svg viewBox="0 0 48 48" fill="none">
                        <rect x="8" y="28" width="8" height="12" stroke="currentColor" strokeWidth="2" rx="1"/>
                        <rect x="20" y="20" width="8" height="20" stroke="currentColor" strokeWidth="2" rx="1"/>
                        <rect x="32" y="12" width="8" height="28" stroke="currentColor" strokeWidth="2" rx="1"/>
                        <path d="M8 24 L20 16 L32 8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
                      </svg>
                    </div>
                  </div>
                  <div className="card-compass">I</div>
                  <h2 className="card-title">M3 Infrastructure</h2>
                  <button
                    className="portal-btn btn-infra"
                    onClick={() => navigate("/login")}
                  >
                    <span>Enter Portal</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <div className="card-glow glow-infra"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Transition Overlay */}
      <div className={`transition-overlay ${overlayActive ? "active" : ""}`}>
        <div className="transition-logo">
          <div className="t-logo-icon">M3</div>
          <div className="t-loader"><div className="t-bar"></div></div>
          <div className="t-text">Redirecting to portal...</div>
        </div>
      </div>

    </div>
  );
}

export default PortalSelection;