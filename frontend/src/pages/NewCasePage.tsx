import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { UploadZone } from '../components/ui/UploadZone';
import { SectionHeader } from '../components/ui/SectionHeader';
import { caseService } from '../services/caseService';

export const NewCasePage: React.FC = () => {
  const navigate = useNavigate();

  const [referenceName, setReferenceName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [upperClothing, setUpperClothing] = useState('');
  const [lowerClothing, setLowerClothing] = useState('');
  const [bagDetails, setBagDetails] = useState('');
  const [accessories, setAccessories] = useState('');
  const [lastLocation, setLastLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [lastDate, setLastDate] = useState('');
  const [lastTime, setLastTime] = useState('');
  const [searchRadius, setSearchRadius] = useState('5');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Form Validation Rules
    if (!referenceName.trim()) {
      setErrorMessage('Subject Reference / Full Name is required.');
      return;
    }
    if (!lastLocation.trim()) {
      setErrorMessage('Last Known Location description is required.');
      return;
    }
    if (latitude && (parseFloat(latitude) < -90 || parseFloat(latitude) > 90)) {
      setErrorMessage('Latitude must be between -90 and 90 degrees.');
      return;
    }
    if (longitude && (parseFloat(longitude) < -180 || parseFloat(longitude) > 180)) {
      setErrorMessage('Longitude must be between -180 and 180 degrees.');
      return;
    }
    if (parseFloat(searchRadius) <= 0) {
      setErrorMessage('Search radius must be greater than 0 km.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('reference_name', referenceName.trim());
      if (ageRange) formData.append('age_range', ageRange);
      if (upperClothing) formData.append('upper_clothing', upperClothing);
      if (lowerClothing) formData.append('lower_clothing', lowerClothing);
      if (bagDetails) formData.append('bag', bagDetails);
      if (accessories) formData.append('accessories', accessories);
      formData.append('last_seen_location', lastLocation.trim());
      if (latitude) formData.append('last_seen_lat', latitude);
      if (longitude) formData.append('last_seen_lng', longitude);

      if (lastDate && lastTime) {
        const combinedIso = new Date(`${lastDate}T${lastTime}`).toISOString();
        formData.append('last_seen_timestamp', combinedIso);
      } else if (lastDate) {
        formData.append('last_seen_timestamp', new Date(lastDate).toISOString());
      }

      formData.append('search_radius_km', searchRadius);
      if (notes) formData.append('notes', notes);
      if (selectedImage) {
        formData.append('file', selectedImage);
      }

      const createdCase = await caseService.createCase(formData);
      setSuccessMessage(`Case created successfully (${createdCase.case_id || createdCase.case_number || 'MP-2026'}).`);
      
      setTimeout(() => {
        navigate(`/cases/${createdCase.id || createdCase.case_id}`);
      }, 1000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Missing Person Case"
        subtitle="Register a new missing-person investigation file and upload reference details."
        breadcrumbs={[
          { label: 'Cases', path: '/cases' },
          { label: 'Create Case' },
        ]}
        action={
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/cases')}>
            Back to Cases
          </Button>
        }
      />

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-center gap-3 text-xs text-red-900 font-bold shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-xs text-emerald-900 font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Section 1: Case Information */}
        <Card>
          <SectionHeader title="Case Information" subtitle="Primary identification markers" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Subject Full Name / Reference"
              placeholder="e.g. Jane Doe"
              value={referenceName}
              onChange={(e) => setReferenceName(e.target.value)}
              required
              helperText="Subject full name or case reference identifier"
            />
            <Select
              label="Age Range"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              options={[
                { value: '', label: 'Select Age Range' },
                { value: 'CHILD', label: 'Child (0-12)' },
                { value: 'TEEN', label: 'Teenager (13-17)' },
                { value: 'ADULT_YOUNG', label: 'Young Adult (18-30)' },
                { value: 'ADULT', label: 'Adult (31-59)' },
                { value: 'SENIOR', label: 'Senior (60+)' },
              ]}
            />
          </div>
        </Card>

        {/* Section 2: Reference Image */}
        <Card>
          <SectionHeader title="Reference Image" subtitle="Upload reference photograph to Supabase Storage" />
          <UploadZone
            label="Reference Photograph"
            helperText="Drag & drop or click to upload (JPG, PNG, WEBP, Max 10MB)"
            onFileSelect={(file) => setSelectedImage(file)}
          />
        </Card>

        {/* Section 3: Appearance */}
        <Card>
          <SectionHeader title="Appearance & Attributes" subtitle="Non-sensitive visual descriptors" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Upper Clothing"
              placeholder="e.g. Black jacket, white t-shirt"
              value={upperClothing}
              onChange={(e) => setUpperClothing(e.target.value)}
            />
            <Input
              label="Lower Clothing"
              placeholder="e.g. Blue denim jeans, brown boots"
              value={lowerClothing}
              onChange={(e) => setLowerClothing(e.target.value)}
            />
            <Input
              label="Bag / Carrying Item"
              placeholder="e.g. Dark red backpack"
              value={bagDetails}
              onChange={(e) => setBagDetails(e.target.value)}
            />
            <Input
              label="Accessories / Distinct Features"
              placeholder="e.g. Glasses, silver watch, cap"
              value={accessories}
              onChange={(e) => setAccessories(e.target.value)}
            />
          </div>
        </Card>

        {/* Section 4: Last Known Location */}
        <Card>
          <SectionHeader title="Last Known Location" subtitle="Geographic and timestamp information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Location Description"
              placeholder="e.g. Central Station, Gate 4"
              value={lastLocation}
              onChange={(e) => setLastLocation(e.target.value)}
              required
              className="sm:col-span-2 lg:col-span-3"
            />
            <Input
              label="Latitude (-90 to 90)"
              type="number"
              step="any"
              placeholder="e.g. 40.7128"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <Input
              label="Longitude (-180 to 180)"
              type="number"
              step="any"
              placeholder="e.g. -74.0060"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
            <Select
              label="Initial Search Radius (km)"
              value={searchRadius}
              onChange={(e) => setSearchRadius(e.target.value)}
              options={[
                { value: '1', label: '1 km' },
                { value: '5', label: '5 km' },
                { value: '10', label: '10 km' },
                { value: '25', label: '25 km' },
                { value: '50', label: '50+ km' },
              ]}
            />
            <Input
              label="Date Last Seen"
              type="date"
              value={lastDate}
              onChange={(e) => setLastDate(e.target.value)}
            />
            <Input
              label="Time Last Seen"
              type="time"
              value={lastTime}
              onChange={(e) => setLastTime(e.target.value)}
            />
          </div>
        </Card>

        {/* Section 5: Additional Notes */}
        <Card>
          <SectionHeader title="Additional Information" subtitle="Investigative notes and context" />
          <Textarea
            label="Notes"
            placeholder="Add relevant case context or investigator notes..."
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={() => navigate('/cases')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />} isLoading={isSubmitting}>
            Create Case
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};
