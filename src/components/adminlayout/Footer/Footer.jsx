import React from 'react'
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      &copy; {new Date().getFullYear()} <span>M3 North</span> — All rights reserved.
    </footer>
  )
}

export default Footer