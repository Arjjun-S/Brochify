import { InfoPageShell, PolicySection } from "@/components/landing/InfoPageShell";

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="Terms"
      title="Terms & Conditions"
      intro="By using Brochify, you agree to the following terms."
    >
      <PolicySection title="1. Usage">
        <p>This platform is intended for academic and professional design purposes.</p>
      </PolicySection>
      <PolicySection title="2. Content Responsibility">
        <p>Users are responsible for the content they generate using Brochify.</p>
      </PolicySection>
      <PolicySection title="3. Restrictions">
        <p>You may not:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Use the platform for illegal or harmful content</li>
          <li>Attempt to reverse engineer or exploit the system</li>
        </ul>
      </PolicySection>
      <PolicySection title="4. Availability">
        <p>We do not guarantee uninterrupted service.</p>
      </PolicySection>
      <PolicySection title="5. Modifications">
        <p>We may update features or terms without prior notice.</p>
      </PolicySection>
      <PolicySection title="6. Liability">
        <p>Brochify is not liable for misuse or external distribution of generated content.</p>
      </PolicySection>
    </InfoPageShell>
  );
}
