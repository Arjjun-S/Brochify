import { InfoPageShell, PolicySection } from "@/components/landing/InfoPageShell";

const faqs = [
  ["1. How do I create a brochure?", "Fill the form -> customize in editor -> download."],
  ["2. Can I edit after generating?", "Yes, all content is editable in the canvas editor."],
  ["3. How does approval work?", "Faculty submits -> admin approves -> download without watermark."],
  ["4. Can I generate multiple certificates?", "Yes, upload CSV/XLSX/JSON for bulk generation."],
  ["5. What happens if not approved?", "Download will include watermark."],
  ["6. Supported formats?", "PDF and image export supported."],
  ["7. Can I upload logos?", "Yes, multiple logos can be added and arranged."],
  ["8. Is internet required?", "Yes, for AI and generation features."],
];

export default function HelpPage() {
  return (
    <InfoPageShell
      eyebrow="Help"
      title="Help & FAQs"
      intro="Quick answers for creating, editing, approving, and exporting with Brochify."
    >
      <div className="grid gap-4">
        {faqs.map(([question, answer]) => (
          <PolicySection key={question} title={question}>
            <p>{answer}</p>
          </PolicySection>
        ))}
      </div>
    </InfoPageShell>
  );
}
