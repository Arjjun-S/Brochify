import { InfoPageShell, PolicySection } from "@/components/landing/InfoPageShell";

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      intro="At Brochify, we respect your privacy and are committed to protecting your data."
    >
      <PolicySection title="1. Information We Collect">
        <p>
          We collect only the data required to generate brochures and certificates, such as text inputs, uploaded
          images, and optional user details.
        </p>
      </PolicySection>
      <PolicySection title="2. Usage of Data">
        <p>Your data is used solely for:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Generating brochures and certificates</li>
          <li>Improving application performance</li>
          <li>Providing support</li>
        </ul>
      </PolicySection>
      <PolicySection title="3. Data Storage">
        <p>
          We do not permanently store sensitive personal data. Generated files may be temporarily stored for
          processing.
        </p>
      </PolicySection>
      <PolicySection title="4. Third-Party Services">
        <p>We may use third-party APIs, AI services, and storage providers strictly for functionality.</p>
      </PolicySection>
      <PolicySection title="5. Security">
        <p>We implement secure practices to protect your data from unauthorized access.</p>
      </PolicySection>
      <PolicySection title="6. Your Rights">
        <p>You can request deletion of your data at any time.</p>
        <p className="mt-3 font-semibold text-[#111b45]">Contact: support@brochify.app</p>
      </PolicySection>
    </InfoPageShell>
  );
}
