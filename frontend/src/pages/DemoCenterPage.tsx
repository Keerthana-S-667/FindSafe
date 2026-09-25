import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, Shield, CheckCircle2, 
  AlertCircle, Info, Sparkles, Layers, Cpu, Server, Lock, Eye, FileText, 
  Camera, Globe, Users, FileDown, ArrowRight, Monitor, ArrowLeft, RefreshCw,
  HelpCircle, Sliders, CheckSquare, Zap, Activity
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { demoService, type DemoStatusData, type DemoScenarioData, type DemoStepDetail } from '../services/demoService';

const demoMarkerIcon = L.divIcon({
  className: 'custom-demo-marker',
  html: `<div style="background-color: #D97706; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-weight: bold; font-size: 13px;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export const DemoCenterPage: React.FC = () => {
  const navigate = useNavigate();

  // Data States
  const [statusData, setStatusData] = useState<DemoStatusData | null>(null);
  const [scenarioData, setScenarioData] = useState<DemoScenarioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Presenter Controls State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<'normal' | 'fast' | 'manual'>('normal');
  const [presentationView, setPresentationView] = useState<boolean>(false);

  // Modal States
  const [showConfirmStart, setShowConfirmStart] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDemoIntel();
  }, []);

  // Auto playback effect
  useEffect(() => {
    let timer: any;
    if (isPlaying && scenarioData && scenarioData.steps.length > 0) {
      const intervalMs = playSpeed === 'fast' ? 1500 : 4000;
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= scenarioData.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, playSpeed, scenarioData]);

  const loadDemoIntel = async () => {
    setLoading(true);
    try {
      const [st, sc] = await Promise.all([
        demoService.getDemoStatus(),
        demoService.getDemoScenario()
      ]);
      setStatusData(st);
      setScenarioData(sc);
    } catch (err) {
      console.warn('Error loading demo control data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareDemo = async () => {
    setLoading(true);
    try {
      const res = await demoService.prepareDemoData();
      setActionMessage(res.message);
      await loadDemoIntel();
    } catch (err) {
      console.warn('Prepare demo error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleResetDemo = async () => {
    setShowConfirmReset(false);
    setLoading(true);
    try {
      const res = await demoService.resetDemoState();
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setActionMessage(res.message);
      await loadDemoIntel();
    } catch (err) {
      console.warn('Reset demo error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleStartDemo = async () => {
    setShowConfirmStart(false);
    try {
      await demoService.startDemoSession();
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setActionMessage('Demo session initialized for CROWDED TRANSIT AREA.');
    } catch (err) {
      console.warn('Start demo error:', err);
    } finally {
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-surface-300">Loading FindSafe AI Demo Control Center...</p>
        </div>
      </PageContainer>
    );
  }

  const steps = scenarioData?.steps || [];
  const currentStep: DemoStepDetail | undefined = steps[currentStepIndex];

  return (
    <PageContainer>
      {/* PERSISTENT DEMO MODE BANNER */}
      <div className="bg-amber-100 border border-amber-300 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-brand-500 text-surface-950 text-xs font-black uppercase font-mono tracking-wider rounded-md">
            DEMO MODE
          </div>
          <div>
            <h1 className="text-base font-extrabold text-amber-900">
              FindSafe AI Demo Control Center
            </h1>
            <p className="text-xs text-amber-800/80 font-medium">
              Synthetic Investigation Data • Precomputed Walkthrough • Zero Production Modification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={presentationView ? 'primary' : 'secondary'}
            onClick={() => setPresentationView(!presentationView)}
            icon={<Monitor className="w-3.5 h-3.5" />}
          >
            {presentationView ? 'Exit Presentation View' : 'Presentation View'}
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => setShowConfirmReset(true)}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Demo
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => navigate('/dashboard')}
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Exit Demo
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          {actionMessage}
        </div>
      )}

      {/* 1. DEMO PREPARATION & READINESS CHECKLIST */}
      {!presentationView && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-extrabold text-surface-950 uppercase tracking-wider">
                  DEMO READINESS CHECKLIST
                </h2>
                <p className="text-xs text-surface-700 font-medium">Automated verification of precomputed synthetic demo components</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={loadDemoIntel} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                  Re-Check
                </Button>
                <Button size="sm" variant="primary" onClick={handlePrepareDemo} icon={<CheckSquare className="w-3.5 h-3.5" />}>
                  Prepare Demo Data
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {(statusData?.checklist || []).map((item) => (
                <div key={item.component} className="p-3 bg-surface-50 border border-surface-400 rounded-xl space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-surface-950">{item.component}</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 rounded uppercase font-mono font-bold">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-surface-700">{item.details}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* PRIMARY SCENARIO CARD */}
          <Card>
            <SectionHeader title="Active Presentation Scenario" subtitle="Synthetic missing person investigation" />
            <div className="space-y-3 mt-3 text-xs">
              <div className="p-3 bg-surface-50 border border-amber-300 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-surface-950 text-sm">{scenarioData?.scenario_name || 'CROWDED TRANSIT AREA'}</span>
                  <span className="font-mono text-brand-700 font-bold">{scenarioData?.case_id}</span>
                </div>
                <p className="text-surface-700 text-[11px]">
                  Multi-camera CCTV analysis across 4 transit terminal cameras with visual attribute matching & synthetic shelter record association.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-surface-300 border border-surface-400 text-surface-950 rounded text-[10px] font-medium">Red Upper</span>
                  <span className="px-2 py-0.5 bg-surface-300 border border-surface-400 text-surface-950 rounded text-[10px] font-medium">Black Lower</span>
                  <span className="px-2 py-0.5 bg-surface-300 border border-surface-400 text-surface-950 rounded text-[10px] font-medium">Blue Backpack</span>
                  <span className="px-2 py-0.5 bg-surface-300 border border-surface-400 text-surface-950 rounded text-[10px] font-medium">Cap</span>
                </div>
              </div>

              <Button 
                variant="primary" 
                className="w-full justify-center text-xs" 
                onClick={() => setShowConfirmStart(true)}
                icon={<Play className="w-4 h-4 fill-current" />}
              >
                Start Presentation Demo
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 2. PRESENTER CONTROLS & STEP PROGRESS BAR */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-surface-300 pb-4 mb-4 gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-xs rounded-lg">
              STEP {currentStepIndex + 1} OF {steps.length}
            </span>
            <div>
              <h2 className="text-base font-extrabold text-surface-950">{currentStep?.title || 'Demo Walkthrough'}</h2>
              <span className="text-xs text-brand-700 font-mono uppercase font-bold">{currentStep?.category}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="p-2 bg-surface-50 border border-surface-400 hover:border-brand-500 disabled:opacity-40 rounded-lg text-surface-950"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-lg text-xs flex items-center gap-2 shadow-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isPlaying ? 'Pause' : 'Play Demo'}
            </button>
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStepIndex === steps.length - 1}
              className="p-2 bg-surface-50 border border-surface-400 hover:border-brand-500 disabled:opacity-40 rounded-lg text-surface-950"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Speed selection */}
            <div className="flex items-center gap-1 bg-surface-50 border border-surface-400 rounded-lg p-1 text-xs">
              {(['normal', 'fast', 'manual'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setPlaySpeed(s); if (s === 'manual') setIsPlaying(false); }}
                  className={`px-2 py-0.5 rounded capitalize text-[10px] font-bold ${
                    playSpeed === s ? 'bg-brand-500 text-white' : 'text-surface-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 12-Step Progress Indicator Bar */}
        <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 mb-6">
          {steps.map((st, idx) => (
            <button
              key={st.step}
              onClick={() => { setCurrentStepIndex(idx); setIsPlaying(false); }}
              className={`p-2 rounded-lg text-center transition-all border ${
                idx === currentStepIndex
                  ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold shadow'
                  : idx < currentStepIndex
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                  : 'bg-surface-50 text-surface-800 border-surface-300 hover:bg-surface-200'
              }`}
            >
              <span className="block text-[10px] font-mono font-bold">{st.step}</span>
              <span className="block text-[9px] truncate font-semibold">{st.category.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* MAIN STEP CONTENT AREA */}
        {currentStep && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step Details & Presenter Notes */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-3 text-xs">
                <p className="text-surface-950 text-sm leading-relaxed font-medium">{currentStep.description}</p>

                {currentStep.evidence_score && (
                  <div className="inline-block px-3 py-1 bg-sky-100 border border-sky-300 rounded-lg font-mono text-sky-900 font-extrabold text-xs">
                    Combined Evidence Score: {currentStep.evidence_score}/100
                  </div>
                )}

                <div className="bg-surface-200 border border-surface-300 p-3 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-surface-700 font-bold uppercase block">Step Key Data Parameters</span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    {Object.entries(currentStep.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-surface-300 pb-1">
                        <span className="text-surface-700 capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="text-surface-950 font-bold truncate max-w-[150px]">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRESENTER NOTES PANEL */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-800">PRESENTER NOTE (SPEAKER GUIDE)</span>
                </div>
                <p className="text-xs text-surface-900 italic leading-relaxed">
                  "{currentStep.presenter_note}"
                </p>
              </div>
            </div>

            {/* GIS Location View */}
            <div className="space-y-4">
              <div className="h-64 rounded-xl overflow-hidden border border-surface-400 z-0">
                <MapContainer 
                  center={[currentStep.lat, currentStep.lng]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%', backgroundColor: '#FAF5EE' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[currentStep.lat, currentStep.lng]} icon={demoMarkerIcon}>
                    <Popup className="text-xs">
                      <strong className="block text-surface-950 font-bold">{currentStep.title}</strong>
                      <span className="text-surface-700 text-[10px]">{currentStep.location_name}</span>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="p-3 bg-surface-50 border border-surface-400 rounded-xl text-xs space-y-1">
                <span className="text-[10px] text-surface-700 font-bold uppercase block">Current Location</span>
                <span className="font-bold text-surface-950 block">{currentStep.location_name}</span>
                <span className="font-mono text-surface-700 text-[10px]">GPS: [{currentStep.lat.toFixed(4)}, {currentStep.lng.toFixed(4)}]</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 3. ARCHITECTURE, TECH STACK & PRIVACY PANELS */}
      {!presentationView && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* SYSTEM ARCHITECTURE FLOW */}
          <Card className="lg:col-span-2">
            <SectionHeader title="System Architecture Flow" subtitle="End-to-end multi-source investigation pipeline" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-xs">
              {(scenarioData?.architecture_flow || []).map((arch) => (
                <div key={arch.step} className="p-3 bg-surface-50 border border-surface-400 rounded-xl space-y-1">
                  <span className="font-bold text-brand-700 block">{arch.step}</span>
                  <p className="text-[11px] text-surface-700">{arch.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* PRIVACY-CONSCIOUS DIFFERENTIATORS */}
          <Card>
            <SectionHeader title="Privacy-Conscious Safeguards" subtitle="Responsible AI design principles" />
            <div className="space-y-3 mt-3 text-xs">
              {(scenarioData?.privacy_differentiators || []).map((diff) => (
                <div key={diff.title} className="p-2.5 bg-surface-50 border border-surface-400 rounded-lg space-y-0.5">
                  <span className="font-bold text-emerald-800 block">{diff.title}</span>
                  <p className="text-[11px] text-surface-700">{diff.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 4. TECHNOLOGY STACK & PROBLEM/SOLUTION */}
      {!presentationView && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* TECH STACK */}
          <Card className="lg:col-span-2">
            <SectionHeader title="Implemented Technology Stack" subtitle="Core software libraries and frameworks" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
              {(scenarioData?.tech_stack || []).map((tech) => (
                <div key={tech.name} className="p-2.5 bg-surface-50 border border-surface-400 rounded-lg space-y-0.5">
                  <span className="font-mono font-bold text-surface-950 block">{tech.name}</span>
                  <span className="text-[10px] text-brand-700 uppercase font-bold block">{tech.category}</span>
                  <p className="text-[10px] text-surface-700">{tech.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* PROBLEM -> SOLUTION -> IMPACT */}
          <Card>
            <SectionHeader title="Why This Matters" subtitle="Public safety problem & solution impact" />
            <div className="space-y-3 mt-3 text-xs">
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl space-y-1">
                <span className="font-bold text-rose-900 block uppercase text-[10px]">The Challenge</span>
                <p className="text-surface-800 text-[11px]">
                  Missing person information is fragmented across CCTV feeds, hospital admissions, shelter logs, and police records.
                </p>
              </div>

              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl space-y-1">
                <span className="font-bold text-emerald-900 block uppercase text-[10px]">The Solution</span>
                <p className="text-surface-800 text-[11px]">
                  FindSafe AI fuses non-sensitive visual descriptors, time, location, and institutional records into an explainable human-verified workflow.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CONFIRM START MODAL */}
      {showConfirmStart && (
        <div className="fixed inset-0 bg-amber-950/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-50 border border-surface-400 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-surface-300 pb-3">
              <Play className="w-5 h-5 text-amber-700" />
              <h3 className="font-extrabold text-surface-950 text-base">Start Presentation Demonstration</h3>
            </div>
            <div className="space-y-2 text-xs text-surface-800">
              <p><strong>Scenario:</strong> Crowded Transit Area Search</p>
              <p><strong>Case Reference:</strong> DEMO-FS-001</p>
              <p><strong>Data Mode:</strong> Synthetic Presentation Data (Does NOT touch real cases)</p>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowConfirmStart(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleStartDemo}>
                Initialize Presentation Walkthrough
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET MODAL */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-amber-950/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-50 border border-surface-400 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-surface-300 pb-3">
              <RotateCcw className="w-5 h-5 text-amber-700" />
              <h3 className="font-extrabold text-surface-950 text-base">Reset Synthetic Demonstration State</h3>
            </div>
            <p className="text-xs text-surface-800">
              This will restore the demo replay and presenter controls to step 1. Production cases, evidence, tasks, and reports will remain completely untouched.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowConfirmReset(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleResetDemo}>
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
