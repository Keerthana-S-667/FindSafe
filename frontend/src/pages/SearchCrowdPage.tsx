import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Video,
  Play,
  Users,
  MapPin,
  Clock,
  AlertCircle,
  Upload,
  FileVideo,
  X,
  Plus,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  History,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/ui/Badge';
import { UploadZone } from '../components/ui/UploadZone';
import { caseService } from '../services/caseService';
import { searchService } from '../services/searchService';
import type { MissingPersonCase, SearchSession, CameraFeed } from '../types';

const MAX_FILE_SIZE_MB = 500;
const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/quicktime', 'video/avi', 'video/x-msvideo',
  'video/x-matroska', 'video/webm', 'video/mp2t', 'video/3gpp', 'image/jpeg', 'image/png'
];
const ALLOWED_EXTENSIONS = [
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.ts', '.3gp', '.jpg', '.jpeg', '.png', '.webp'
];

export const SearchCrowdPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCaseId = searchParams.get('case_id') || '';

  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);

  // Multi-Camera Feeds state
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>([
    {
      id: 'cam-1',
      camera_name: 'Camera 01 - North Entrance',
      location_name: 'Central Transit Gate A',
      latitude: 13.0827,
      longitude: 80.2707,
      video_file: null,
      video_preview_url: null
    },
    {
      id: 'cam-2',
      camera_name: 'Camera 02 - Concourse Exit',
      location_name: 'Metro Terminal South',
      latitude: 13.0850,
      longitude: 80.2740,
      video_file: null,
      video_preview_url: null
    }
  ]);

  const [recentSessions, setRecentSessions] = useState<SearchSession[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load cases and recent sessions
  useEffect(() => {
    const fetchData = async () => {
      setLoadingCases(true);
      try {
        const caseRes = await caseService.getCases();
        const caseList = caseRes.items || [];
        setCases(caseList);
        if (!selectedCaseId && caseList.length > 0) {
          setSelectedCaseId(caseList[0].id);
        }

        const sessionList = await searchService.getSearchSessions();
        setRecentSessions(sessionList);
      } catch (err: any) {
        console.error('Failed to load initial search data:', err);
      } finally {
        setLoadingCases(false);
      }
    };
    fetchData();
  }, []);

  // Sync selected case history
  useEffect(() => {
    if (!selectedCaseId) return;
    searchService.getSearchSessions(selectedCaseId).then((data) => {
      if (data && data.length > 0) {
        setRecentSessions(data);
      }
    }).catch(() => {});
  }, [selectedCaseId]);

  // Add camera feed card
  const handleAddCameraFeed = () => {
    setCameraFeeds((prev) => {
      const nextNum = prev.length + 1;
      return [
        ...prev,
        {
          id: `cam-${Date.now()}`,
          camera_name: `Camera ${nextNum < 10 ? '0' + nextNum : nextNum} - Source`,
          location_name: '',
          latitude: null,
          longitude: null,
          video_file: null,
          video_preview_url: null
        }
      ];
    });
  };

  // Remove camera feed card
  const handleRemoveCameraFeed = (id: string) => {
    setCameraFeeds((prev) => {
      if (prev.length <= 1) {
        setError('At least one camera feed is required.');
        return prev;
      }
      return prev.filter((c) => c.id !== id);
    });
  };

  // Update camera feed field
  const handleUpdateCameraFeed = (id: string, field: keyof CameraFeed, value: any) => {
    setCameraFeeds((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Camera Video File Selection & Validation
  const handleCameraFileChange = (id: string, file: File | null) => {
    setError(null);
    if (!file) {
      setCameraFeeds((prev) =>
        prev.map((c) => (c.id === id ? { ...c, video_file: null, video_preview_url: null } : c))
      );
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMedia = file.type.startsWith('video/') || file.type.startsWith('image/') || ALLOWED_EXTENSIONS.includes(ext);

    if (!isMedia && !ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError(`Unsupported video format for file ${file.name}. Allowed: MP4, MOV, AVI, MKV, WEBM.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Video ${file.name} exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCameraFeeds((prev) =>
      prev.map((c) => (c.id === id ? { ...c, video_file: file, video_preview_url: objectUrl } : c))
    );
  };

  const handleAttachSampleVideo = (id: string, feedName: string) => {
    setError(null);
    const sampleContent = new Blob(['FindSafe AI CCTV Video Stream Payload Data'], { type: 'video/mp4' });
    const sampleFile = new File([sampleContent], `${feedName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_sample.mp4`, { type: 'video/mp4' });
    const objectUrl = URL.createObjectURL(sampleFile);
    setCameraFeeds((prev) =>
      prev.map((c) => (c.id === id ? { ...c, video_file: sampleFile, video_preview_url: objectUrl } : c))
    );
  };

  // Submit Multi-Camera Search Session
  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCaseId) {
      setError('Please select an active missing-person case.');
      return;
    }

    const validFeeds = cameraFeeds.filter((c) => c.video_file !== null);
    if (validFeeds.length === 0) {
      setError('Please attach at least one valid CCTV video file for search analysis.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('case_id', selectedCaseId);

    const metaPayload: any[] = [];

    validFeeds.forEach((feed) => {
      if (feed.video_file) {
        formData.append('videos', feed.video_file);
        metaPayload.push({
          camera_name: feed.camera_name,
          location_name: feed.location_name,
          latitude: feed.latitude,
          longitude: feed.longitude
        });
      }
    });

    formData.append('camera_metadata_json', JSON.stringify(metaPayload));

    try {
      const session = await searchService.createMultiVideoSearch(formData, (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        }
      });

      // Navigate to processing view
      navigate(`/search/crowd/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize multi-camera video search session. Please check network connection.');
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Search The Crowd (Multi-Camera CCTV Analysis)"
        subtitle="Ingest and analyze multiple camera videos to track and match potential candidates across locations using YOLO, ByteTrack, and OSNet Re-ID."
      />

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl flex items-start gap-3 text-xs text-red-300 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Configuration Error</span>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search Configuration (2 cols) */}
        <form onSubmit={handleStartSearch} className="lg:col-span-2 space-y-6">
          <Card>
            <SectionHeader
              title="Target Missing Person Case"
              subtitle="Select reference subject file for multi-camera appearance matching"
            />

            <div className="mt-4">
              {loadingCases ? (
                <div className="p-3 bg-surface-50 border border-surface-400 rounded-lg text-xs text-surface-700 flex items-center gap-2 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  Loading missing-person cases...
                </div>
              ) : cases.length === 0 ? (
                <div className="p-4 bg-surface-50 border border-surface-400 rounded-xl text-center space-y-3 shadow-xs">
                  <p className="text-xs text-surface-700 font-medium">No active cases available.</p>
                  <Link to="/cases/new">
                    <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>
                      Create Case
                    </Button>
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-400 rounded-lg px-3 py-2.5 text-xs text-surface-950 font-bold focus:outline-none focus:border-brand-500"
                  required
                >
                  <option value="">-- Choose Missing Person Case --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_id || 'CASE'} - {c.reference_name || c.full_name} ({c.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </Card>

          {/* MULTI-CAMERA FEEDS SECTION */}
          <Card>
            <div className="flex items-center justify-between border-b border-surface-300 pb-3 mb-4">
              <SectionHeader
                title="Camera Feeds"
                subtitle="Upload CCTV videos associated with camera source locations"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCameraFeed}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Camera Feed
              </Button>
            </div>

            <div className="space-y-4">
              {cameraFeeds.map((feed, idx) => (
                <div
                  key={feed.id}
                  className="p-4 bg-surface-50 border border-surface-400 rounded-xl space-y-4 relative group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="brand">Camera 0{idx + 1}</Badge>
                      <input
                        type="text"
                        value={feed.camera_name}
                        onChange={(e) => handleUpdateCameraFeed(feed.id, 'camera_name', e.target.value)}
                        className="bg-transparent text-xs font-extrabold text-surface-950 focus:outline-none focus:border-b border-brand-500"
                        placeholder="Camera Identifier Name"
                        required
                      />
                    </div>
                    {cameraFeeds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCameraFeed(feed.id)}
                        className="p-1 text-surface-700 hover:text-red-700 transition-colors font-bold"
                        title="Remove camera feed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <Input
                      label="Location / Landmark Name"
                      placeholder="e.g. North Gate Concourse"
                      value={feed.location_name || ''}
                      onChange={(e) => handleUpdateCameraFeed(feed.id, 'location_name', e.target.value)}
                      icon={<MapPin className="w-3.5 h-3.5" />}
                    />
                    <Input
                      label="Latitude (Optional)"
                      type="number"
                      step="any"
                      placeholder="e.g. 13.0827"
                      value={feed.latitude ?? ''}
                      onChange={(e) => handleUpdateCameraFeed(feed.id, 'latitude', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                    <Input
                      label="Longitude (Optional)"
                      type="number"
                      step="any"
                      placeholder="e.g. 80.2707"
                      value={feed.longitude ?? ''}
                      onChange={(e) => handleUpdateCameraFeed(feed.id, 'longitude', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>

                  {/* Video File Dropzone for this Camera */}
                  <UploadZone
                    label={`CCTV Video Stream for ${feed.camera_name}`}
                    helperText="Supported formats: MP4, MOV, AVI, MKV, WEBM (Max 500MB)"
                    accept="video/*,image/*,.mp4,.mov,.avi,.mkv,.webm,.m4v,.ts"
                    maxSizeMB={500}
                    value={feed.video_file}
                    onFileSelect={(file) => handleCameraFileChange(feed.id, file)}
                    sampleButtonLabel="Attach Sample Demo Video"
                    onSampleSelect={() => handleAttachSampleVideo(feed.id, feed.camera_name)}
                  />
                </div>
              ))}
            </div>

            {/* Upload Progress Bar */}
            {isSubmitting && uploadProgress !== null && (
              <div className="p-4 bg-brand-500/15 border border-brand-500/30 rounded-xl space-y-2 mt-6">
                <div className="flex items-center justify-between text-xs font-extrabold text-brand-800">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                    Uploading Multi-Camera CCTV Videos to Supabase Storage...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-surface-300 h-2 rounded-full overflow-hidden border border-surface-400">
                  <div
                    className="bg-brand-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Start Search Action */}
            <div className="pt-6 border-t border-surface-300 mt-6 flex items-center justify-between">
              <span className="text-xs text-surface-700 font-medium">
                {cameraFeeds.filter((c) => c.video_file !== null).length} camera feed(s) ready
              </span>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !selectedCaseId || cameraFeeds.filter((c) => c.video_file !== null).length === 0}
                icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              >
                {isSubmitting ? 'Initializing Search...' : 'Start Multi-Camera Search'}
              </Button>
            </div>
          </Card>
        </form>

        {/* Right Column: Search Session History */}
        <div className="space-y-6">
          <Card>
            <SectionHeader
              title="Recent Search Sessions"
              subtitle="Previous multi-camera search sessions for selected case"
            />

            {recentSessions.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No video searches yet"
                  description="Multi-camera search sessions will be recorded here."
                  icon={History}
                />
              </div>
            ) : (
              <div className="space-y-3 mt-4 max-h-[550px] overflow-y-auto pr-1">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/search/crowd/${session.id}`)}
                    className="p-3.5 bg-surface-50 hover:bg-surface-200 border border-surface-400 hover:border-brand-500 rounded-xl cursor-pointer transition-all duration-200 group shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-brand-600" />
                        <span className="text-xs font-extrabold text-surface-950 truncate max-w-[140px]">
                          {session.video_filename || 'CCTV Search'}
                        </span>
                      </div>
                      <Badge
                        variant={
                          session.status === 'completed'
                            ? 'success'
                            : session.status === 'failed' || session.status === 'cancelled'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-surface-700 space-y-1 font-medium">
                      <div className="flex justify-between">
                        <span>Progress:</span>
                        <span className="font-mono text-brand-700 font-bold">{session.processing_progress || 0}%</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-surface-700 pt-1 border-t border-surface-300">
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                        <span className="group-hover:text-brand-700 font-bold flex items-center gap-1 transition-colors">
                          View Session <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
