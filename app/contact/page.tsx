import { InfoPageShell, PolicySection } from "@/components/landing/InfoPageShell";

export default function ContactPage() {
  return (
    <InfoPageShell
      eyebrow="Contact"
      title="Contact Us"
      intro="Have questions or feedback? We would love to hear from you."
    >
      <PolicySection title="Email">
        <p className="font-semibold text-[#111b45]">support@brochify.app</p>
      </PolicySection>
      <PolicySection title="Institution">
        <p>SRM Institute of Science and Technology</p>
        <p>Department of Computing Technologies</p>
      </PolicySection>
      <PolicySection title="Response Time">
        <p>Within 24-48 hours</p>
      </PolicySection>
      <PolicySection title="For Technical Issues">
        <p>Please include:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Screenshot</li>
          <li>Description of the issue</li>
        </ul>
      </PolicySection>
    </InfoPageShell>
  );
}
