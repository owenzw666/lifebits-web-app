import LegalPage, { LegalSection } from "../components/LegalPage";

const Privacy = () => (
  <LegalPage title="Privacy Policy" effectiveDate="22 June 2026">
    <p>
      Lifebits Map helps you save private notes, places, dates, and photos on a
      personal map. This policy explains what information the service handles.
    </p>

    <LegalSection title="Information we collect">
      <p>
        We store your email address, authentication details, places, notes,
        dates, categories, and photos that you choose to add. If you allow
        location access, your browser may provide a location used to position
        the map. Google sign-in provides a verified email address and may
        provide a display name and profile image.
      </p>
    </LegalSection>

    <LegalSection title="How information is used">
      <p>
        Information is used to operate your account, display your private map,
        send account emails, protect the service, diagnose errors, and maintain
        backups. Lifebits Map does not sell your personal information.
      </p>
    </LegalSection>

    <LegalSection title="Service providers">
      <p>
        The service uses Microsoft Azure for hosting and storage, Brevo for
        transactional email, Google for optional sign-in, and map and geocoding
        providers to display maps and find place names. These providers process
        limited information needed to deliver their services under their own
        privacy terms.
      </p>
    </LegalSection>

    <LegalSection title="Retention and deletion">
      <p>
        Your active account data is retained while your account exists. You can
        delete individual content or delete your account from the Account page.
        Account deletion removes active account data and stored photos. Encrypted
        or restricted backups may retain deleted data temporarily until they are
        automatically replaced or expire.
      </p>
    </LegalSection>

    <LegalSection title="Security and your choices">
      <p>
        We use access controls, private photo storage, encrypted connections,
        password hashing, and limited-lived authentication tokens. No online
        service can guarantee absolute security. You can refuse browser location
        access and still use the map manually.
      </p>
    </LegalSection>

    <LegalSection title="Contact">
      <p>
        Privacy questions can be sent to{" "}
        <a href="mailto:privacy@lifebitsmap.com">privacy@lifebitsmap.com</a>.
      </p>
    </LegalSection>
  </LegalPage>
);

export default Privacy;
