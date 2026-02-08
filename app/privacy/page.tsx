export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[var(--sz-navy)] safe-top safe-bottom">
      <div className="px-5 py-8 max-w-2xl mx-auto">
        <h1 className="font-display text-4xl text-[var(--sz-white)] mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--sz-gray)] mb-8">
          Last updated: February 1, 2026
        </p>

        <div className="space-y-6 text-[var(--sz-gray)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Introduction
            </h2>
            <p>
              StreamZone ("we," "our," or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your information
              when you use our mobile application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Information We Collect
            </h2>
            <p className="mb-3">
              StreamZone collects minimal information to provide our services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-[var(--sz-white)]">Location (State/Region):</strong> You
                manually select your state or region to determine local broadcast availability
                and blackout restrictions. We do not collect precise GPS location data.
              </li>
              <li>
                <strong className="text-[var(--sz-white)]">Favorite Teams:</strong> Your selected
                favorite teams are stored locally on your device to personalize your experience.
              </li>
              <li>
                <strong className="text-[var(--sz-white)]">Notification Preferences:</strong> If
                you enable game reminders, your notification settings and scheduled reminders are
                stored locally on your device.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              How We Use Your Information
            </h2>
            <p className="mb-3">We use the information you provide to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Display relevant streaming options based on your location</li>
              <li>Show games for your favorite teams</li>
              <li>Send game reminder notifications (if enabled)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Data Storage
            </h2>
            <p>
              All user preferences (favorite teams, location selection, and notification settings)
              are stored locally on your device using standard browser/app storage mechanisms.
              We do not transmit or store this personal data on external servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Third-Party Services
            </h2>
            <p className="mb-3">
              Our app connects to the following third-party services to provide functionality:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-[var(--sz-white)]">MLB Stats API:</strong> To retrieve
                game schedules, scores, and standings
              </li>
              <li>
                <strong className="text-[var(--sz-white)]">Ticketmaster API:</strong> To provide
                links to purchase tickets for games
              </li>
            </ul>
            <p className="mt-3">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Data Sharing
            </h2>
            <p>
              We do not sell, trade, or otherwise transfer your information to third parties.
              Your data remains on your device.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Children's Privacy
            </h2>
            <p>
              Our app does not knowingly collect personal information from children under 13.
              The app is designed for general audiences interested in sports streaming information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Your Rights
            </h2>
            <p>
              Since all data is stored locally on your device, you have full control over your
              information. You can clear your app data at any time through your device settings
              to remove all stored preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--sz-white)] mb-3">
              Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{' '}
              <a
                href="mailto:streamzonesports@gmail.com"
                className="text-[var(--sz-lime)] hover:underline"
              >
                streamzonesports@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--sz-navy-lighter)]">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[var(--sz-lime)] hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to StreamZone
          </a>
        </div>
      </div>
    </main>
  )
}
