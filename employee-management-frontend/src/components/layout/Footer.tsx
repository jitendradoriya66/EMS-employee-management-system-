import React from 'react'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border mt-lg no-print">
      <div className="px-md md:px-lg py-md flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
        <p className="text-sm text-text-secondary">
          © {currentYear} Workforce Hub. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-md gap-y-xs">
          <a
            href="#"
            className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  )
}
