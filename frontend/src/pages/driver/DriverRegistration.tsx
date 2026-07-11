import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Phone, Mail, Calendar, Camera,
  Truck, Bike, Car, ShieldCheck, Upload,
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, Info,
  Image as ImageIcon, Briefcase, UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { register as authRegister } from '@/services/api/authService';
import { uploadDriverDocuments } from '@/services/api/uploadService';
import { UserRole } from '@/types';
import { validatePassword } from '@/utils/validation';
import CitySelector from '@/components/common/CitySelector';

const DriverRegistration = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: '',
    address: '',
    city: '',
    profilePhoto: null as File | null,
    profilePhotoPreview: '',

    // Step 2: Vehicle
    vehicleType: '',
    vehicleBrand: '',
    licensePlate: '',
    insurancePhoto: null as File | null,
    insurancePreview: '',

    // Step 3: Documents
    idFront: null as File | null,
    idBack: null as File | null,
    drivingLicense: null as File | null,
    selfie: null as File | null,
    location: null as { lat: number; lng: number } | null,
  });

  const navigate = useNavigate();

  const fileRefs = {
    profile: useRef<HTMLInputElement>(null),
    insurance: useRef<HTMLInputElement>(null),
    idFront: useRef<HTMLInputElement>(null),
    idBack: useRef<HTMLInputElement>(null),
    license: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null),
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        [field]: file,
        [`${field}Preview`]: previewUrl
      }));
      setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    }
  };

  const isStep1Valid = () => {
    const { fullName, phone, email, password, confirmPassword, dob, gender, address, city } = formData;
    return fullName && phone && email && !validatePassword(password) && (password === confirmPassword) && dob && gender && address && city;
  };

  const isStep2Valid = () => {
    const { vehicleType, vehicleBrand, licensePlate, insurancePhoto } = formData;
    if (!vehicleType || !vehicleBrand) return false;
    if (vehicleType !== 'BICYCLE' && (!licensePlate || !insurancePhoto)) return false;
    return true;
  };

  const isStep3Valid = () => {
    const { idFront, idBack, drivingLicense, selfie } = formData;
    return idFront && idBack && drivingLicense && selfie;
  };

  const handleNext = () => {
    if (step === 1 && isStep1Valid()) setStep(2);
    else if (step === 2 && isStep2Valid()) setStep(3);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const filesToUpload: Record<string, File> = {};
      if (formData.idFront) filesToUpload.idFront = formData.idFront;
      if (formData.idBack) filesToUpload.idBack = formData.idBack;
      if (formData.drivingLicense) filesToUpload.drivingLicense = formData.drivingLicense;
      if (formData.selfie) filesToUpload.selfie = formData.selfie;

      toast.info('Uploading documents...', { duration: 2000 });
      const uploadedUrls = await uploadDriverDocuments(filesToUpload, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [progress.fileName]: progress.percent
        }));
      });

      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';
      const documentsString = JSON.stringify(uploadedUrls);

      await authRegister({
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        role: 'DRIVER' as UserRole,
        phoneNumber: formData.phone,
        vehicleType: formData.vehicleType,
        licenseNumber: formData.licensePlate,
        documents: documentsString,
        city: formData.city,
        address: formData.address,
        latitude: formData.location?.lat,
        longitude: formData.location?.lng,
      });

      setIsLoading(false);
      setIsSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      console.error('Driver registration error:', error);
      const message = error?.message || error?.response?.data?.message || 'Error during submission. Please try again.';
      toast.error(message);
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 font-sans text-foreground">
        <div className="w-full max-w-md text-center">
          <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden p-8 space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Application Received!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your account is under review. You will be notified by email once approved.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Status: Pending validation
            </div>
            <Button
              onClick={() => navigate('/')}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs rounded-md shadow-sm"
            >
              Return Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background py-4 px-4 font-sans text-foreground selection:bg-primary/30">
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">CargoLink</span>
        </Link>
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Driver Application
        </div>
      </div>

      <Card className="w-full max-w-3xl border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Driver Registration
            </CardTitle>
            
            {/* Compact Stepper */}
            <div className="flex items-center gap-2 sm:gap-4 self-center sm:self-auto">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground border border-border'}`}>
                      {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s === 1 ? 'Personal' : s === 2 ? 'Vehicle' : 'Documents'}
                    </span>
                  </div>
                  {s < 3 && <div className={`w-8 h-[1px] rounded-full transition-colors duration-300 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground">Full Name *</Label>
                    <Input id="fullName" value={formData.fullName} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card" placeholder="John Doe" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">Phone Number *</Label>
                    <Input id="phone" value={formData.phone} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card" placeholder="06XXXXXXXX" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Email Address *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card" placeholder="john@example.com" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-xs font-semibold text-muted-foreground">Date of Birth *</Label>
                    <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card dark:[color-scheme:dark]" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">Password *</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card" placeholder="••••••••" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground">Confirm Password *</Label>
                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card" placeholder="••••••••" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Gender *</Label>
                    <Select onValueChange={(v) => handleSelectChange('gender', v)} value={formData.gender}>
                      <SelectTrigger className="h-10 text-xs border-border bg-card rounded-md">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="MALE" className="text-xs">Male</SelectItem>
                        <SelectItem value="FEMALE" className="text-xs">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">City / Region *</Label>
                    <CitySelector
                      value={formData.city}
                      onValueChange={(v) => handleSelectChange('city', v)}
                      className="space-y-0"
                      label=""
                      placeholder="Select city"
                      triggerClassName="border-border bg-card h-10 text-xs w-full rounded-md"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="address" className="text-xs font-semibold text-muted-foreground">Full Address *</Label>
                    <Input id="address" value={formData.address} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card" placeholder="Street name, District, Postal Code" />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Profile Photo *</Label>
                    <div
                      className="w-full h-14 border border-dashed border-border bg-muted/10 hover:bg-muted/20 rounded-md flex items-center px-4 cursor-pointer transition-all gap-4"
                      onClick={() => fileRefs.profile.current?.click()}
                    >
                      <input type="file" ref={fileRefs.profile} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePhoto')} />
                      {formData.profilePhotoPreview ? (
                        <div className="flex items-center gap-3 w-full">
                          <img src={formData.profilePhotoPreview} className="w-8 h-8 rounded-md object-cover border border-border" alt="Preview" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground">Photo Selected</p>
                            <p className="text-[10px] text-muted-foreground">Click to change</p>
                          </div>
                          {uploadProgress.profilePhoto > 0 && uploadProgress.profilePhoto < 100 && (
                            <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-primary" style={{ width: `${uploadProgress.profilePhoto}%` }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Camera className="w-4 h-4 text-muted-foreground" />
                          <div className="text-left">
                            <span className="text-xs font-semibold text-foreground block">Upload a Profile Photo</span>
                            <span className="text-[10px] text-muted-foreground block">JPG, PNG up to 5MB</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border mt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!isStep1Valid()}
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    Next Step: Vehicle Info <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : step === 2 ? (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Vehicle Type *</Label>
                    <Select onValueChange={(v) => handleSelectChange('vehicleType', v)} value={formData.vehicleType}>
                      <SelectTrigger className="h-10 text-xs border-border bg-card rounded-md">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="BICYCLE" className="text-xs"><div className="flex items-center gap-2"><Bike className="w-3.5 h-3.5" /> Bicycle / E-bike</div></SelectItem>
                        <SelectItem value="MOTORCYCLE" className="text-xs"><div className="flex items-center gap-2"><Bike className="w-3.5 h-3.5" /> Motorcycle / Scooter</div></SelectItem>
                        <SelectItem value="CAR" className="text-xs"><div className="flex items-center gap-2"><Car className="w-3.5 h-3.5" /> Car (Sedan/SUV)</div></SelectItem>
                        <SelectItem value="VAN" className="text-xs"><div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Van / Small Truck</div></SelectItem>
                        <SelectItem value="TRUCK" className="text-xs"><div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Heavy Truck</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="vehicleBrand" className="text-xs font-semibold text-muted-foreground">Brand & Model *</Label>
                    <Input id="vehicleBrand" value={formData.vehicleBrand} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card" placeholder="e.g., Ford Transit" />
                  </div>

                  {formData.vehicleType !== 'BICYCLE' && formData.vehicleType !== '' && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5">
                        <Label htmlFor="licensePlate" className="text-xs font-semibold text-muted-foreground">License Plate *</Label>
                        <Input id="licensePlate" value={formData.licensePlate} onChange={handleInputChange} className="h-10 text-xs rounded-md border-border bg-card font-mono uppercase tracking-wider" placeholder="ABC-123" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Vehicle Insurance *</Label>
                        <div
                          className="h-10 border border-dashed border-border bg-muted/10 hover:bg-muted/20 rounded-md flex items-center px-4 cursor-pointer transition-all gap-3"
                          onClick={() => fileRefs.insurance.current?.click()}
                        >
                          <input type="file" ref={fileRefs.insurance} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'insurancePhoto')} />
                          <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            {formData.insurancePhoto ? (
                              <span className="text-xs font-bold text-sky-500 truncate block">{formData.insurancePhoto.name}</span>
                            ) : (
                              <span className="text-xs font-bold text-muted-foreground">Upload Insurance</span>
                            )}
                          </div>
                          {uploadProgress.insurancePhoto > 0 && uploadProgress.insurancePhoto < 100 && (
                            <div className="w-16 h-1 bg-border rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-sky-500" style={{ width: `${uploadProgress.insurancePhoto}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-sky-500/5 border border-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-semibold leading-normal">
                    {formData.vehicleType === 'BICYCLE'
                      ? "Eco-friendly choice! No insurance or plate required for bicycles."
                      : formData.vehicleType === 'TRUCK'
                        ? "Heavy vehicles require additional weight certifications during review."
                        : "Ensure your vehicle documentation is up to date for faster approval."}
                  </p>
                </div>

                <div className="pt-2 border-t border-border mt-4 flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="h-10 flex-1 border-border text-foreground font-semibold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!isStep2Valid()}
                    className="h-10 flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    Next Step: Documents <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">ID Card (Front & Back) *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className="h-14 border border-dashed border-border bg-muted/10 hover:bg-muted/20 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all text-center p-1 relative overflow-hidden"
                        onClick={() => fileRefs.idFront.current?.click()}
                      >
                        <input type="file" ref={fileRefs.idFront} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'idFront')} />
                        {formData.idFront ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-foreground truncate max-w-[80px]">{formData.idFront.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="w-4 h-4 text-muted-foreground mb-0.5" />
                            <span className="text-[9px] font-bold text-muted-foreground">ID Front</span>
                          </div>
                        )}
                        {uploadProgress.idFront > 0 && uploadProgress.idFront < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                            <div className="h-full bg-primary" style={{ width: `${uploadProgress.idFront}%` }} />
                          </div>
                        )}
                      </div>

                      <div
                        className="h-14 border border-dashed border-border bg-muted/10 hover:bg-muted/20 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all text-center p-1 relative overflow-hidden"
                        onClick={() => fileRefs.idBack.current?.click()}
                      >
                        <input type="file" ref={fileRefs.idBack} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'idBack')} />
                        {formData.idBack ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-foreground truncate max-w-[80px]">{formData.idBack.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="w-4 h-4 text-muted-foreground mb-0.5" />
                            <span className="text-[9px] font-bold text-muted-foreground">ID Back</span>
                          </div>
                        )}
                        {uploadProgress.idBack > 0 && uploadProgress.idBack < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                            <div className="h-full bg-primary" style={{ width: `${uploadProgress.idBack}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">License & Selfie Documents *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className="h-14 border border-dashed border-border bg-muted/10 hover:bg-muted/20 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all text-center p-1 relative overflow-hidden"
                        onClick={() => fileRefs.license.current?.click()}
                      >
                        <input type="file" ref={fileRefs.license} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'drivingLicense')} />
                        {formData.drivingLicense ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-foreground truncate max-w-[80px]">{formData.drivingLicense.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Briefcase className="w-4 h-4 text-muted-foreground mb-0.5" />
                            <span className="text-[9px] font-bold text-muted-foreground">License</span>
                          </div>
                        )}
                        {uploadProgress.drivingLicense > 0 && uploadProgress.drivingLicense < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                            <div className="h-full bg-primary" style={{ width: `${uploadProgress.drivingLicense}%` }} />
                          </div>
                        )}
                      </div>

                      <div
                        className="h-14 border border-dashed border-border bg-muted/10 hover:bg-muted/20 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all text-center p-1 relative overflow-hidden"
                        onClick={() => fileRefs.selfie.current?.click()}
                      >
                        <input type="file" ref={fileRefs.selfie} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie')} />
                        {formData.selfie ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-foreground truncate max-w-[80px]">{formData.selfie.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <UserCircle className="w-4 h-4 text-muted-foreground mb-0.5" />
                            <span className="text-[9px] font-bold text-muted-foreground">Selfie</span>
                          </div>
                        )}
                        {uploadProgress.selfie > 0 && uploadProgress.selfie < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                            <div className="h-full bg-primary" style={{ width: `${uploadProgress.selfie}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-semibold leading-normal">
                    Your data is encrypted and secure. We use bank-level security to protect your sensitive documents.
                  </p>
                </div>

                <div className="pt-2 border-t border-border mt-4 flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="h-10 flex-1 border-border text-foreground font-semibold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Vehicle Info
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !isStep3Valid()}
                    className="h-10 flex-[2] bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs rounded-md shadow-sm flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Submit Registration"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Link to="/login" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
          Partner Log In
        </Link>
      </div>
    </div>
  );
};

export default DriverRegistration;
