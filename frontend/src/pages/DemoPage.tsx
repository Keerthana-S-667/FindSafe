import React from 'react';
import { PlayCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';

export const DemoPage: React.FC = () => {
  const steps = [
    { num: '1', title: 'Select Demo Case', desc: 'Load authorized reference photograph and subject attributes.' },
    { num: '2', title: 'Process Video', desc: 'Attach CCTV footage stream for YOLO detection and ByteTrack tracking.' },
    { num: '3', title: 'Review Candidates', desc: 'Inspect side-by-side OSNet re-ID visual similarity crops.' },
    { num: '4', title: 'Compare Records', desc: 'Cross-verify against PostgreSQL intake logs and hospital filings.' },
    { num: '5', title: 'Generate Report', desc: 'Compile official investigation timeline and audit records.' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Demo Mode"
        subtitle="Controlled environment for hackathon evaluation and end-to-end system testing."
      />

      <Card>
        <SectionHeader title="Demonstration Workflow Roadmap" subtitle="Phase 2 Architectural Shell" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-4">
          {steps.map((step, idx) => (
            <div key={idx} className="p-4 bg-surface-50 border border-surface-400 rounded-xl relative flex flex-col justify-between shadow-xs">
              <div>
                <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-800 border border-brand-500/40 flex items-center justify-center text-xs font-extrabold font-mono mb-3">
                  {step.num}
                </div>
                <h4 className="text-xs font-extrabold text-surface-950 mb-1">{step.title}</h4>
                <p className="text-[11px] text-surface-800 font-medium leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-surface-200 border border-surface-300 rounded-xl text-xs text-surface-950 space-y-2 mt-6">
          <div className="flex items-center gap-2 font-bold text-surface-950">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Operational System Note</span>
          </div>
          <p className="text-[11px] text-surface-800 font-medium leading-relaxed">
            Demo Mode UI shell is visually established. Live AI video pipelines and automated candidate generation will be attached in subsequent development phases.
          </p>
        </div>
      </Card>
    </PageContainer>
  );
};
