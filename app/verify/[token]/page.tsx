import { prisma } from "@/lib/server/prisma";

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const verification = await prisma.certificateVerification.findUnique({
    where: { verificationToken: token },
    include: { certificate: true },
  });

  if (!verification) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
        <div className="p-8 bg-slate-900 rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center max-w-md w-full animate-in fade-in zoom-in duration-300">
          <div className="h-16 w-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 text-3xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-extrabold mb-3 tracking-tight">Verification Failed</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The certificate verification ID <strong>{token}</strong> is invalid or does not exist in our database.
          </p>
        </div>
      </div>
    );
  }

  const certificateContent = verification.certificate.content as any;
  const eventName = certificateContent?.templateInput?.eventName || "Event Participation";
  const organizationName = verification.organization || certificateContent?.templateInput?.organizationName || "SRM Institute of Science and Technology";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white font-sans overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative p-8 md:p-10 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5),0_0_30px_rgba(16,185,129,0.1)] max-w-xl w-full text-center animate-in fade-in zoom-in duration-500">
        
        {/* Animated Checkmark Group */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md scale-110 animate-pulse" />
          <div className="relative h-20 w-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-in zoom-in-50 duration-700 delay-100 ease-out">
            <svg 
              className="h-10 w-10 text-emerald-400 stroke-current animate-in fade-in zoom-in-75 duration-500 delay-300"
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1 tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
          Verified Certificate
        </h1>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase mb-8">
          Secured by Brochify Verification Registry
        </p>

        {/* Certificate Details */}
        <div className="text-left space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/80 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between pb-3.5 border-b border-slate-800 gap-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Recipient Student</span>
            <span className="text-white font-bold text-sm tracking-wide md:text-right">{verification.recipientName}</span>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between pb-3.5 border-b border-slate-800 gap-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Event / Activity</span>
            <span className="text-white font-bold text-sm tracking-wide md:text-right">{eventName}</span>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between pb-3.5 border-b border-slate-800 gap-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Certificate ID</span>
            <span className="text-indigo-400 font-mono font-bold text-xs tracking-wider md:text-right">{verification.verificationToken}</span>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between pb-3.5 border-b border-slate-800 gap-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Institution</span>
            <span className="text-white font-bold text-sm tracking-wide md:text-right">{organizationName}</span>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between pb-3.5 border-b border-slate-800 gap-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Issue Date</span>
            <span className="text-white font-bold text-sm tracking-wide md:text-right">{new Date(verification.generatedAt).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between pt-1 gap-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              VERIFIED
            </span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-slate-500 tracking-normal max-w-sm mx-auto leading-relaxed">
          This verification confirms the record is authentic and exists within the register. For questions, contact the issuing institution.
        </p>
      </div>
    </div>
  );
}
