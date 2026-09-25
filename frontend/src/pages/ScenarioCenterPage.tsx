import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { replayService, ScenarioItem, ScenarioDetailData } from '../services/replayService';
import { 
  Play, Pause, RotateCcw, ShieldAlert, Cpu, ArrowRight, CheckCircle2, 
  Layers, Lock, Eye, FileText, Camera, ShieldCheck 
} from 'lucide-react';

export const ScenarioCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-transit-01');
  const [scenarioDetail, setScenarioDetail] = useState<ScenarioDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo Walkthrough State
  const [activeStep, setActiveStep] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  useEffect(() => {
    replayService.getScenarios()
      .then((data) => {
        setScenarios(data);
        if (data.length > 0) {
          setSelectedScenarioId(data[0].id);
        }
      })
      .catch((err) => console.error('Error fetching scenarios:', err));
  }, []);

  useEffect(() => {
    if (selectedScenarioId) {
      setLoading(true);
      setActiveStep(0);
      setIsPlayingDemo(false);
      replayService.getScenarioDetail(selectedScenarioId)
        .then((data) => setScenarioDetail(data))
        .catch((err) => console.error('Error fetching scenario detail:', err))
        .finally(() => setLoading(false));
    }
  }, [selectedScenarioId]);

  // Demo Playback Loop
  useEffect(() => {
    let timer: any = null;
    if (isPlayingDemo && scenarioDetail && scenarioDetail.events.length > 0) {
      timer = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= scenarioDetail.events.length - 1) {
            setIsPlayingDemo(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isPlayingDemo, scenarioDetail]);

  const currentScenario = scenarioDetail?.scenario;
  const events = scenarioDetail?.events || [];
  const currentEvent = events[activeStep];

  return (
    <PageContainer>
      <PageHeader
        title="Scenario Center & Hackathon Demo Walkthrough"
        subtitle="Precomputed synthetic presentation scenarios for demonstrating multi-camera search, attribute matching, cross-source evidence, human review, and report generation."
      />

      {/* Mandatory Scenario Mode Privacy & Isolation Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-900 mb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <strong className="text-amber-950 block font-bold">SCENARIO MODE — Synthetic Demo Data ONLY</strong>
            All subjects, CCTV feeds, and records are controlled synthetic demo objects. Does not alter production case data.
          </div>
        </div>
        <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-950 border border-amber-500/40 font-bold uppercase text-[10px]">
          Demo Environment
        </span>
      </div>

      {/* SCENARIO SELECTOR GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scenarios.map((scen) => (
          <div
            key={scen.id}
            onClick={() => setSelectedScenarioId(scen.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedScenarioId === scen.id
                ? 'bg-surface-50 border-brand-500 ring-2 ring-brand-500 shadow-sm'
                : 'bg-surface-200 border-surface-400 hover:border-brand-500'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-surface-800 mb-1">
              <span className="font-mono font-bold text-brand-700">{scen.reference_profile.case_code}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-brand-500/15 text-brand-900 font-bold border border-brand-500/30">Ready</span>
            </div>
            <h4 className="text-sm font-extrabold text-surface-950 mb-1">{scen.name}</h4>
            <p className="text-xs text-surface-800 font-medium line-clamp-2 mb-3">{scen.description}</p>
            <div className="text-[11px] text-brand-700 flex items-center justify-between font-bold">
              <span>{scen.events_count} Replay Events</span>
              <span className="flex items-center gap-1 font-bold">Select Scenario <ArrowRight className="w-3 h-3" /></span>
            </div>
          </div>
        ))}
      </div>

      {/* SCENARIO DEMO CONTROL BAR */}
      <div className="bg-surface-50 border border-surface-400 rounded-xl p-5 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-surface-800 font-bold">Active Presentation Scenario</span>
          <h3 className="text-lg font-extrabold text-surface-950 mt-0.5">{currentScenario?.name}</h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveStep(0); setIsPlayingDemo(false); }}
            className="px-3 py-2 rounded-lg bg-surface-200 border border-surface-400 hover:bg-surface-300 text-xs font-bold text-surface-950 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={() => setIsPlayingDemo(!isPlayingDemo)}
            className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            {isPlayingDemo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlayingDemo ? 'Pause Walkthrough' : 'Start Demo'}</span>
          </button>
        </div>
      </div>


      {/* SCENARIO WALKTHROUGH MAIN CONTENT */}
      {loading ? (
        <div className="py-12 text-center text-surface-800 font-bold text-xs">Loading scenario events...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left 2 Cols: Step-by-Step Evidence Accumulation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Detail Card */}
            {currentEvent && (
              <div className="bg-surface-50 border border-brand-500 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-surface-300 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                      {currentEvent.sequence_number}
                    </span>
                    <span className="text-xs uppercase font-extrabold text-brand-700 tracking-wider">
                      {currentEvent.event_type}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-surface-800">{currentEvent.timestamp}</span>
                </div>

                <h3 className="text-lg font-extrabold text-surface-950">{currentEvent.title}</h3>
                <p className="text-sm text-surface-950 font-medium leading-relaxed">{currentEvent.description}</p>

                {currentEvent.evidence_score && (
                  <div className="p-3 bg-surface-200 rounded-lg border border-surface-400 flex items-center justify-between text-xs font-bold">
                    <span className="text-surface-950">Accumulated Evidence Score</span>
                    <span className="text-base font-extrabold text-brand-700 font-mono">{currentEvent.evidence_score}/100</span>
                  </div>
                )}
              </div>
            )}

            {/* Sequence Checklist */}
            <div className="bg-surface-50 border border-surface-400 rounded-xl p-6 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-surface-950">Demo Sequence Steps</h4>
              <div className="space-y-2">
                {events.map((ev, idx) => {
                  const isActive = idx === activeStep;
                  const isDone = idx < activeStep;
                  return (
                    <div
                      key={ev.sequence_number}
                      onClick={() => { setActiveStep(idx); setIsPlayingDemo(false); }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isActive
                          ? 'bg-surface-200 border-brand-500 ring-2 ring-brand-500 font-bold'
                          : isDone
                          ? 'bg-surface-100 border-surface-300 text-surface-800'
                          : 'bg-surface-50 border-surface-300 text-surface-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-surface-950">{ev.sequence_number}.</span>
                        <span className="font-bold text-surface-950">{ev.title}</span>
                      </div>
                      <span className="font-mono font-bold text-surface-800">{ev.timestamp}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Col: Reference Profile & Privacy Controls Panel */}
          <div className="space-y-6">
            {/* Reference Profile Card */}
            <div className="bg-surface-50 border border-surface-400 rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-surface-950">Synthetic Target Profile</h4>
              <div className="p-3 bg-surface-200 border border-surface-300 rounded-lg space-y-1.5 font-mono text-surface-950 font-medium">
                <div>Name: <strong className="text-surface-950 font-bold">{currentScenario?.reference_profile.name}</strong></div>
                <div>Upper: <strong className="text-brand-700 font-bold">{currentScenario?.reference_profile.upper_clothing}</strong></div>
                <div>Lower: <strong className="text-brand-700 font-bold">{currentScenario?.reference_profile.lower_clothing}</strong></div>
                <div>Bag: <strong className="text-brand-700 font-bold">{currentScenario?.reference_profile.bag}</strong></div>
              </div>
            </div>

            {/* Presentation Privacy Panel */}
            <div className="bg-surface-50 border border-surface-400 rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Presentation Privacy Controls</span>
              </h4>
              <ul className="space-y-2 text-surface-950 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>No Facial Recognition or Biometric Extraction</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Non-Sensitive Visual Attribute Classification Only</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Mandatory Human Verification Required</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Complete Audit History Persistence</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
