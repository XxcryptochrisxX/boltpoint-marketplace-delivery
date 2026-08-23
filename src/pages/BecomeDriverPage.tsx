import { useState, FormEvent } from 'react';
import { ViewMode, VehicleType } from '../types';
import { saveDriverApplication } from '../lib/supabaseClient';
import { SEOHead } from '../components/common/SEOHead';
import { VEHICLE_TYPES } from '../constants';
import { Truck, Upload, CheckCircle2, DollarSign, Clock, ShieldCheck, FileText, ArrowRight, X } from 'lucide-react';

interface BecomeDriverPageProps {
  onNavigate: (view: ViewMode) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function BecomeDriverPage({ onNavigate, onShowToast }: BecomeDriverPageProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Pickup Truck');
  const [hasInsurance, setHasInsurance] = useState(true);
  const [insuranceDocName, setInsuranceDocName] = useState<string>('');
  const [driverLicenseName, setDriverLicenseName] = useState<string>('');
  const [citiesServedInput, setCitiesServedInput] = useState('Austin, Round Rock, Cedar Park');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday', 'Saturday']);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSimulatedFileUpload = (type: 'insurance' | 'license', fileList: FileList | null) => {
    if (fileList && fileList[0]) {
      const filename = fileList[0].name;
      if (type === 'insurance') {
        setInsuranceDocName(filename);
      } else {
        setDriverLicenseName(filename);
      }
      onShowToast('File Uploaded', `${filename} ready for review`, 'info');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      onShowToast('Missing Fields', 'Please complete your name, phone, and email.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const citiesArray = citiesServedInput.split(',').map((c) => c.trim()).filter(Boolean);
      const appResult = await saveDriverApplication({
        name,
        phone,
        email,
        vehicleType,
        hasInsurance,
        insuranceDocName: insuranceDocName || 'insurance_policy_doc.pdf',
        driverLicenseName: driverLicenseName || 'driver_license_scan.jpg',
        citiesServed: citiesArray.length > 0 ? citiesArray : ['Austin'],
        daysAvailable: selectedDays,
      });

      setSubmittedAppId(appResult.id || 'DRV-99201');
      onShowToast('Application Submitted!', 'Our driver onboarding team will contact you within 24 hours.', 'success');
    } catch (err) {
      onShowToast('Submission Error', 'Failed to save application. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEOHead customMetadata={{ title: 'Become a Delivery Partner | Marketplace Delivery', description: 'Earn $35-$75/hr delivering oversized items with your truck or van.' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/40">
            <Truck className="w-3.5 h-3.5" />
            <span>Driver Onboarding Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Turn Your Truck or Van into Daily Income
          </h1>
          <p className="text-slate-300 text-base sm:text-lg">
            Deliver furniture for Facebook Marketplace buyers and local shops. Flexible schedule, instant payouts, and zero signup fees.
          </p>

          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-xs text-left">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-amber-400 font-bold block text-sm">$35 – $75/hr</span>
              <span className="text-slate-400">Average Driver Pay</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-blue-400 font-bold block text-sm">Weekly Direct</span>
              <span className="text-slate-400">Direct Deposit</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 col-span-2 sm:col-span-1">
              <span className="text-emerald-400 font-bold block text-sm">100% Tips</span>
              <span className="text-slate-400">Keep All Your Tips</span>
            </div>
          </div>
        </div>

        {/* Application Form Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
          <div className="pb-6 mb-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Driver Application Form</h2>
              <p className="text-xs text-slate-500 mt-1">Complete your profile to get access to available local delivery jobs.</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Quick 3-Min Form
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Contact Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(512) 555-0199"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marcus@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">2. Select Your Delivery Vehicle</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VEHICLE_TYPES.map((v) => (
                  <label
                    key={v.id}
                    onClick={() => setVehicleType(v.id as VehicleType)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      vehicleType === v.id
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicleType"
                      checked={vehicleType === v.id}
                      onChange={() => setVehicleType(v.id as VehicleType)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{v.label}</span>
                      <span className="text-xs text-slate-500 mt-0.5 block">{v.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Coverage & Availability */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">3. Cities & Weekly Availability</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cities / Areas Served</label>
                <input
                  type="text"
                  value={citiesServedInput}
                  onChange={(e) => setCitiesServedInput(e.target.value)}
                  placeholder="Austin, Round Rock, Pflugerville, San Marcos"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Days Available for Jobs</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Document Upload Simulation */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">4. Upload Credentials</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Insurance Upload */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-all">
                  <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <span className="font-bold text-slate-900 text-sm block">Upload Vehicle Insurance</span>
                  <span className="text-xs text-slate-500 block mt-0.5">PDF or image file (Max 10MB)</span>
                  
                  {insuranceDocName ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{insuranceDocName}</span>
                    </div>
                  ) : (
                    <label className="mt-3 inline-block px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-100 transition-all shadow-xs">
                      <span>Select Insurance File</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleSimulatedFileUpload('insurance', e.target.files)}
                      />
                    </label>
                  )}
                </div>

                {/* License Upload */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-all">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <span className="font-bold text-slate-900 text-sm block">Upload Driver&apos;s License</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Front side scan or photo</span>

                  {driverLicenseName ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{driverLicenseName}</span>
                    </div>
                  ) : (
                    <label className="mt-3 inline-block px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-100 transition-all shadow-xs">
                      <span>Select License File</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleSimulatedFileUpload('license', e.target.files)}
                      />
                    </label>
                  )}
                </div>

              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                By submitting, you agree to our Driver Partner Terms and background check authorization.
              </p>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all shrink-0 flex items-center gap-2"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Driver Application'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>

        {/* Confirmation Modal */}
        {submittedAppId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900">Application Received!</h3>
              
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                Application ID: <strong>{submittedAppId}</strong>
              </div>

              <p className="text-slate-600 text-sm">
                Thank you for applying, <strong>{name}</strong>. Our driver onboarding team is reviewing your license and insurance documents. You will receive an SMS update at {phone}.
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onNavigate('driver-dashboard')}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-sm transition-all"
                >
                  Go to Driver Portal Preview
                </button>
                <button
                  onClick={() => setSubmittedAppId(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-all"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
