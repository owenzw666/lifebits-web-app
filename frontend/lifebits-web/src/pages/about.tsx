import LegalPage, { LegalSection } from "../components/LegalPage";

const About = () => (
  <LegalPage title="About Lifebits Map" effectiveDate="27 August 2026">
    <p>
      Lifebits Map is a private place-memory map for saving the moments
      connected to the places in your life.
    </p>

    <LegalSection title="Why I built it">
      <p>
        Many meaningful memories are tied to places: a quiet walk, a family
        trip, a work milestone, or an ordinary day that becomes important later.
        Lifebits Map was built to keep those stories, photos, and dates together
        instead of leaving them scattered across photo albums and chat history.
      </p>
    </LegalSection>

    <LegalSection title="What you can do">
      <p>
        You can create and edit notes on a map, attach photos, record when
        something happened, search your personal timeline, and export your
        memories when you want a copy outside the service.
      </p>
    </LegalSection>

    <LegalSection title="Privacy first">
      <p>
        Your map is private to your account. Lifebits Map uses authenticated
        access, private photo storage, encrypted connections, and account
        deletion tools so your personal memories stay under your control.
      </p>
    </LegalSection>

    <LegalSection title="Built as a full-stack project">
      <p>
        Lifebits Map is also a full-stack engineering project built with React,
        TypeScript, .NET, SQLite, Azure App Service, Azure Blob Storage, OAuth,
        automated tests, and CI/CD deployment.
      </p>
    </LegalSection>
  </LegalPage>
);

export default About;
