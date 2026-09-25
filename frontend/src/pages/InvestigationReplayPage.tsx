import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { replayService, ReplayData, ReplayEvent } from '../services/replayService';
import { ReplayControls } from '../components/replay/ReplayControls';
import { 
  ArrowLeft, Clock, MapPin, Camera, FileText, User, ShieldAlert, 
  Layers, CheckCircle2, ChevronRight, Play 
} from 'lucide-react';

// Marker Icon
const createMarkerIcon = (color: string) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

export const InvestigationReplayPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);

  // Replay State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      replayService.getSessionReplay(sessionId)
        .then((data) => setReplayData(data))
        .catch((err) => console.error('Error fetching replay:', err))
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  // Automatic Playback Timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && replayData && replayData.events.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= replayData.events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, replayData]);

  if (loading) {
    return (
      <PageContainer>
        <div className="py-16 text-center text-surface-300 text-xs">Loading investigation replay sequence...</div>
      </PageContainer>
    );
  }

  const session = replayData?.session;
  const events = replayData?.events || [];
  const currentEvent: ReplayEvent | undefined = events[currentIndex];

  const mapCenter: [number, number] = [
    currentEvent?.lat || 28.6139,
    currentEvent?.lng || 77.2090
  ];

  return (
    <PageContainer>
      <PageHeader
        title={`Historical Investigation Replay #${sessionId?.substring(0, 8)}`}
        subtitle="Sequential evidence event timeline playback representing how visual, attribute, spatial, and record evidence accumulated."
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(`/cases/${session?.case_id || ''}/investigation`)}
          >
            Back to Workspace
          </Button>
        }
      />

      {/* Replay Banner */}
      <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl flex items-center justify-between text-xs text-surface-950 mb-6">
        <div className="flex items-center gap-2 text-brand-700 font-bold">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span><strong>Historical Investigation Replay:</strong> Replays stored evidence events. No AI inference re-executed during replay.</span>
        </div>
        <span className="font-mono text-surface-950 font-bold">Case: {session?.cases?.case_id || session?.case_id || 'MP-CASE'}</span>
      </div>

      {/* PLAYBACK CONTROLS */}
      <div className="mb-6">
        <ReplayControls
          isPlaying={isPlaying}
          currentIndex={currentIndex}
          totalEvents={events.length}
          playbackSpeed={playbackSpeed}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentIndex((prev) => Math.min(events.length - 1, prev + 1))}
          onRestart={() => { setCurrentIndex(0); setIsPlaying(false); }}
          onSpeedChange={(spd) => setPlaybackSpeed(spd)}
        />
      </div>

      {/* REPLAY MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timeline & Current Event Detail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Event Detail Card */}
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
                <span className="text-xs text-surface-800 font-bold flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-surface-700" />
                  {currentEvent.timestamp}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-surface-950">{currentEvent.title}</h3>
              <p className="text-sm text-surface-950 font-medium leading-relaxed">{currentEvent.description}</p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-surface-200 rounded-lg border border-surface-300">
                  <span className="text-surface-800 block text-[10px] font-bold">Location Context</span>
                  <span className="font-bold text-surface-950 mt-0.5 block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-surface-700" />
                    {currentEvent.location_name}
                  </span>
                </div>
                <div className="p-3 bg-surface-200 rounded-lg border border-surface-300">
                  <span className="text-surface-800 block text-[10px] font-bold">Evidence Score Contribution</span>
                  <span className="font-extrabold text-brand-700 mt-0.5 block font-mono">
                    {currentEvent.evidence_score ? `${currentEvent.evidence_score}/100` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sequential Event Timeline */}
          <div className="bg-surface-50 border border-surface-400 rounded-xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-surface-950">Investigation Event Sequence</h4>
            <div className="space-y-2">
              {events.map((ev, idx) => {
                const isActive = idx === currentIndex;
                const isPassed = idx < currentIndex;
                return (
                  <div
                    key={ev.sequence_number}
                    onClick={() => { setCurrentIndex(idx); setIsPlaying(false); }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      isActive
                        ? 'bg-surface-200 border-brand-500 ring-2 ring-brand-500 font-bold'
                        : isPassed
                        ? 'bg-surface-100 border-surface-300 text-surface-800'
                        : 'bg-surface-50 border-surface-300 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isActive ? 'bg-brand-600 text-white' : 'bg-surface-300 text-surface-950'
                      }`}>
                        {ev.sequence_number}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-surface-950">{ev.title}</div>
                        <div className="text-[11px] text-surface-800 font-medium">{ev.location_name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-surface-800">{ev.timestamp}</span>
                      {ev.evidence_score && (
                        <span className="font-mono font-bold text-brand-700">{ev.evidence_score}/100</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Synchronized Replay GIS Map */}
        <div className="space-y-6">
          <div className="bg-surface-50 border border-surface-400 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-surface-950">Synchronized GIS Evidence Location</h4>
            <div className="h-64 rounded-xl overflow-hidden border border-surface-300 relative">
              <MapContainer center={mapCenter} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapCenter} icon={createMarkerIcon('#A64F19')}>
                  <Popup>
                    <div className="p-1 text-xs text-surface-950">
                      <strong className="font-bold">{currentEvent?.title}</strong>
                      <p>{currentEvent?.location_name}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="text-[11px] text-surface-800 font-medium">
              Potential Evidence Sequence location • Highlights spatial context at replay timestep.
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
