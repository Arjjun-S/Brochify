"use client";

import dynamic from "next/dynamic";
import { Loader } from "lucide-react";

interface CertificateEditorPageProps {
  initialData: {
    id: number;
    content: {
      overlayItems: unknown[];
      templateInput: unknown;
      template: string;
      background: {
        borderColor: string;
        backgroundImage: string;
      };
    };
    status: string;
  };
}

const CertificateEditor = dynamic(
  () => import("@/features/certificate/components/certificate-editor").then((mod) => mod.CertificateEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export default function CertificateEditorPage({ initialData }: CertificateEditorPageProps) {
  return <CertificateEditor initialData={initialData} />;
}
