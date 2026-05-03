import { InfoPageShell, PolicySection } from "@/components/landing/InfoPageShell";

export default function TutorialsPage() {
  return (
    <InfoPageShell
      eyebrow="Tutorials"
      title="Tutorials"
      intro="Step-by-step guides for brochures, certificates, the editor, and bulk uploads."
    >
      <PolicySection title="1. Creating a Brochure">
        <ul className="list-disc space-y-2 pl-5">
          <li>Fill details</li>
          <li>Select template</li>
          <li>Customize text and layout</li>
          <li>Download PDF</li>
        </ul>
      </PolicySection>
      <PolicySection title="2. Certificate Generator">
        <ul className="list-disc space-y-2 pl-5">
          <li>Enter event details</li>
          <li>Upload student data</li>
          <li>Preview first certificate</li>
          <li>Generate bulk ZIP</li>
        </ul>
      </PolicySection>
      <PolicySection title="3. Using Editor">
        <ul className="list-disc space-y-2 pl-5">
          <li>Single click: move</li>
          <li>Double click: edit text</li>
          <li>Use toolbar for styling</li>
        </ul>
      </PolicySection>
      <PolicySection title="4. Bulk Upload Format">
        <p className="font-semibold text-[#111b45]">Columns:</p>
        <p>s.no, name, year, gender, prize</p>
      </PolicySection>
      <PolicySection title="5. Tips">
        <ul className="list-disc space-y-2 pl-5">
          <li>Keep content concise</li>
          <li>Use consistent fonts</li>
          <li>Preview before downloading</li>
        </ul>
      </PolicySection>
    </InfoPageShell>
  );
}
