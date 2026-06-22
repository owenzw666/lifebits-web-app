import LegalPage, { LegalSection } from "../components/LegalPage";

const Terms = () => (
  <LegalPage title="Terms of Service" effectiveDate="22 June 2026">
    <p>
      These terms apply when you create an account or use Lifebits Map. By using
      the service, you agree to these terms.
    </p>

    <LegalSection title="Your account">
      <p>
        You are responsible for keeping your sign-in details secure and for
        activity performed through your account. Provide accurate account
        information and notify us if you believe your account is compromised.
      </p>
    </LegalSection>

    <LegalSection title="Your content">
      <p>
        You keep ownership of the notes and photos you add. You give Lifebits Map
        permission to store, process, back up, and display that content only as
        needed to provide and protect the service. Do not upload unlawful content
        or content that violates another person's rights.
      </p>
    </LegalSection>

    <LegalSection title="Acceptable use">
      <p>
        Do not misuse the service, attempt unauthorized access, disrupt its
        operation, upload malicious material, or use it to violate applicable
        law. Access may be limited or suspended when reasonably necessary to
        protect users or the service.
      </p>
    </LegalSection>

    <LegalSection title="Service availability">
      <p>
        Lifebits Map is provided as an evolving service. Features may change and
        temporary interruptions may occur. Maintain your own copies of content
        that is especially important to you.
      </p>
    </LegalSection>

    <LegalSection title="Liability">
      <p>
        To the extent permitted by law, the service is provided without implied
        guarantees beyond rights that cannot legally be excluded. Lifebits Map is
        not liable for indirect or consequential loss arising from use of the
        service.
      </p>
    </LegalSection>

    <LegalSection title="Ending use">
      <p>
        You may stop using the service or delete your account at any time. These
        terms may be updated as the service develops; material changes will be
        communicated through the service where practical.
      </p>
    </LegalSection>

    <LegalSection title="Contact">
      <p>
        Questions about these terms can be sent to{" "}
        <a href="mailto:privacy@lifebitsmap.com">privacy@lifebitsmap.com</a>.
      </p>
    </LegalSection>
  </LegalPage>
);

export default Terms;
