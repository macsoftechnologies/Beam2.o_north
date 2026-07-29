import React from 'react'
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-top-row">
          <span>&copy; {new Date().getFullYear()}</span>
          <span className="footer-brand">M3 North</span>
        </div>
        <span className="footer-sep">—</span>
        <span className="footer-rights">All rights reserved.</span>
      </div>
    </footer>
  )
}

export default Footer