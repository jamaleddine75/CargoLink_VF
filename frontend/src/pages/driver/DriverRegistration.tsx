import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, MapPin, Camera,
  Truck, Bike, Car, ShieldCheck, CreditCard,
  Upload, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, Info, Building,
  Key, Image as ImageIcon, Briefcase, UserCircle,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
    bankInfo: '',
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
      // Reset progress for this file if it was previously failed/partial
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
    const { idFront, idBack, drivingLicense, selfie, bankInfo } = formData;
    return idFront && idBack && drivingLicense && selfie && bankInfo;
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
      // 1. Collect files for upload
      const filesToUpload: Record<string, File> = {};
      if (formData.idFront) filesToUpload.idFront = formData.idFront;
      if (formData.idBack) filesToUpload.idBack = formData.idBack;
      if (formData.drivingLicense) filesToUpload.drivingLicense = formData.drivingLicense;
      if (formData.selfie) filesToUpload.selfie = formData.selfie;
      if (formData.profilePhoto) filesToUpload.profilePhoto = formData.profilePhoto;
      if (formData.insurancePhoto) filesToUpload.insurancePhoto = formData.insurancePhoto;

      // 2. Perform Uploads
      toast.info('Uploading documents...', { duration: 2000 });
      const uploadedUrls = await uploadDriverDocuments(filesToUpload, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [progress.fileName]: progress.percent
        }));
      });

      // 3. Prepare registration data
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';

      // Convert the map of URLs to a string for the current backend requirement
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
      const message = error.message || error.response?.data?.message || 'Error during submission. Please try again.';
      toast.error(message);
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-lg text-center"
        >
          <div className="bg-card/40 backdrop-blur-3xl border border-border/50 rounded-[40px] p-10 shadow-2xl">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight">Application Received!</h2>
            <div className="space-y-4 mb-8">
              <p className="text-muted-foreground font-medium leading-relaxed">
                Your account is under review. You will be notified by email once approved.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-bold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Status : Pending validation
              </div>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg rounded-2xl transition-all shadow-xl shadow-primary/10"
            >
              Return home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background py-4 px-4 relative overflow-hidden transition-colors duration-500 font-sans selection:bg-primary/30">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-[0.4]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full animate-pulse opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse opacity-60" />
      </div>

      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors z-20 group uppercase tracking-widest"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[900px]"
      >
        <div className="text-center mb-4 space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2.5 mb-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Truck className="w-7 h-7" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-foreground">CargoLink</span>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">Become a Delivery Partner</h1>
          <p className="text-muted-foreground font-medium text-lg">Start earning with CargoLink's trusted network</p>
        </div>

        <Card className="border-border/50 bg-card/40 backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${step >= s ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground border border-border/50'}`}>
                      {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}>
                      {s === 1 ? 'Personal' : s === 2 ? 'Vehicle' : 'Documents'}
                    </span>
                  </div>
                  {s < 3 && <div className={`w-16 h-[2px] rounded-full transition-colors duration-300 mt-[-20px] ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </React.Fragment>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="space-y-8"
                >
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="fullName" value={formData.fullName} onChange={handleInputChange} className="pl-14 h-13 bg-accent/30 border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-primary/10 transition-all" placeholder="John Doe" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="phone" value={formData.phone} onChange={handleInputChange} className="pl-14 h-13 bg-accent/30 border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-primary/10 transition-all" placeholder="06XXXXXXXX" />
                        </div>
                      </div>


                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-14 h-13 bg-accent/30 border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50" placeholder="john@example.com" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                          <Input id="password" type="password" value={formData.password} onChange={handleInputChange} className="pl-14 h-13 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600" placeholder="••••••••" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</Label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                          <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} className="pl-14 h-13 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600" placeholder="••••••••" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date of Birth</Label>
                        <div className="relative group">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} className="pl-14 h-13 bg-accent/30 border-border rounded-2xl text-foreground dark:[color-scheme:dark]" />
                        </div>
                      </div>


                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gender</Label>
                        <Select onValueChange={(v) => handleSelectChange('gender', v)}>
                          <SelectTrigger className="h-13 bg-accent/30 border-border rounded-2xl text-foreground px-4">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>


                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Address</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="address" value={formData.address} onChange={handleInputChange} className="pl-14 h-13 bg-accent/30 border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50" placeholder="Street, Postal Code" />
                        </div>
                      </div>

                      <CitySelector
                        value={formData.city}
                        onValueChange={(v) => handleSelectChange('city', v)}
                        className="space-y-2"
                        label="City / Region"
                      />



                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Profile Photo</Label>
                      <div
                        className="w-full h-24 border-2 border-dashed border-white/10 bg-white/5 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group"
                        onClick={() => fileRefs.profile.current?.click()}
                      >
                        <input type="file" ref={fileRefs.profile} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePhoto')} />
                        {formData.profilePhotoPreview ? (
                          <div className="flex items-center gap-4 animate-in fade-in zoom-in">
                            <img src={formData.profilePhotoPreview} className="w-20 h-20 rounded-2xl object-cover border-2 border-primary" alt="Preview" />
                            <div className="text-left">
                              <p className="text-sm font-bold text-foreground">Photo Selected</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Click to change</p>
                              {uploadProgress.profilePhoto > 0 && uploadProgress.profilePhoto < 100 && (
                                <div className="mt-2 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress.profilePhoto}%` }} />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-slate-500 group-hover:scale-110 transition-transform mb-2" />
                            <p className="text-sm font-black text-white">Upload a Profile Photo</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">JPG, PNG up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={handleNext}
                        disabled={!isStep1Valid()}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl rounded-2xl shadow-xl shadow-primary/20 group transition-all"
                      >
                        Step 2: Vehicle Info <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="space-y-8"
                >
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Type</Label>
                        <Select onValueChange={(v) => handleSelectChange('vehicleType', v)}>
                          <SelectTrigger className="h-13 bg-white/5 border-white/10 rounded-2xl text-white px-4">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">
                            <SelectItem value="BICYCLE"><div className="flex items-center gap-2"><Bike className="w-4 h-4" /> Bicycle / E-bike</div></SelectItem>
                            <SelectItem value="MOTORCYCLE"><div className="flex items-center gap-2"><Bike className="w-4 h-4" /> Motorcycle / Scooter</div></SelectItem>
                            <SelectItem value="CAR"><div className="flex items-center gap-2"><Car className="w-4 h-4" /> Car (Sedan/SUV)</div></SelectItem>
                            <SelectItem value="VAN"><div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Van / Small Truck</div></SelectItem>
                            <SelectItem value="TRUCK"><div className="flex items-center gap-2"><Truck className="w-5 h-5" /> Heavy Truck</div></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand & Model</Label>
                        <div className="relative group">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                          <Input id="vehicleBrand" value={formData.vehicleBrand} onChange={handleInputChange} className="pl-14 h-13 bg-white/5 border-white/10 rounded-2xl text-white" placeholder="e.g., Ford Transit" />
                        </div>
                      </div>

                      {formData.vehicleType !== 'BICYCLE' && formData.vehicleType !== '' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2 md:col-span-2"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">License Plate</Label>
                              <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-sky-500 transition-colors" />
                                <Input id="licensePlate" value={formData.licensePlate} onChange={handleInputChange} className="pl-14 h-13 bg-white/5 border-white/10 rounded-2xl text-white font-mono tracking-widest" placeholder="ABC-123" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Insurance</Label>
                              <div
                                className="h-13 border border-white/10 bg-white/5 rounded-2xl flex items-center px-4 cursor-pointer hover:bg-white/10 transition-all gap-3"
                                onClick={() => fileRefs.insurance.current?.click()}
                              >
                                <input type="file" ref={fileRefs.insurance} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'insurancePhoto')} />
                                <Upload className="w-4.5 h-4.5 text-slate-500" />
                                <div className="flex-1 min-w-0">
                                  {formData.insurancePhoto ? (
                                    <>
                                      <span className="text-sm font-bold text-sky-500 truncate block">{formData.insurancePhoto.name}</span>
                                      {uploadProgress.insurancePhoto > 0 && uploadProgress.insurancePhoto < 100 && (
                                        <div className="mt-1 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${uploadProgress.insurancePhoto}%` }} />
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-sm font-bold text-slate-500">Upload Insurance</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 p-6 rounded-3xl bg-sky-500/5 border border-sky-500/10 text-sky-500">
                      <Info className="w-6 h-6 flex-shrink-0" />
                      <p className="text-xs font-bold leading-relaxed italic">
                        {formData.vehicleType === 'BICYCLE'
                          ? "Eco-friendly choice! No insurance or plate required for bicycles."
                          : formData.vehicleType === 'TRUCK'
                            ? "Heavy vehicles require additional weight certifications during review."
                            : "Ensure your vehicle documentation is up to date for faster approval."}
                      </p>
                    </div>

                    <div className="pt-4 flex flex-col md:flex-row gap-4">
                      <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="h-14 flex-1 bg-accent/30 border-border hover:bg-accent/50 text-foreground font-black text-xl rounded-2xl"
                      >
                        <ArrowLeft className="w-5 h-5 mr-3" /> Step 1
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={!isStep2Valid()}
                        className="h-14 flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl rounded-2xl shadow-xl shadow-primary/20 group transition-all"
                      >
                        Last Step: Documents <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>

                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="space-y-8"
                >
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID Card (Front & Back)</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div
                            className="h-28 border-2 border-dashed border-white/10 bg-white/5 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-center p-2 relative overflow-hidden"
                            onClick={() => fileRefs.idFront.current?.click()}
                          >
                            <input type="file" ref={fileRefs.idFront} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'idFront')} />
                            {formData.idFront ? (
                              <>
                                <CheckCircle2 className="w-6 h-6 text-sky-500" />
                                {uploadProgress.idFront > 0 && uploadProgress.idFront < 100 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                    <div className="h-full bg-sky-500" style={{ width: `${uploadProgress.idFront}%` }} />
                                  </div>
                                )}
                              </>
                            ) : <ImageIcon className="w-6 h-6 text-slate-600 mb-1" />}
                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">{formData.idFront ? 'Front OK' : 'ID Front'}</span>
                          </div>
                          <div
                            className="h-28 border-2 border-dashed border-white/10 bg-white/5 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-center p-2 relative overflow-hidden"
                            onClick={() => fileRefs.idBack.current?.click()}
                          >
                            <input type="file" ref={fileRefs.idBack} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'idBack')} />
                            {formData.idBack ? (
                              <>
                                <CheckCircle2 className="w-6 h-6 text-sky-500" />
                                {uploadProgress.idBack > 0 && uploadProgress.idBack < 100 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                    <div className="h-full bg-sky-500" style={{ width: `${uploadProgress.idBack}%` }} />
                                  </div>
                                )}
                              </>
                            ) : <ImageIcon className="w-6 h-6 text-slate-600 mb-1" />}
                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">{formData.idBack ? 'Back OK' : 'ID Back'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">License & Selfie</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div
                            className="h-28 border-2 border-dashed border-white/10 bg-white/5 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-center p-2 relative overflow-hidden"
                            onClick={() => fileRefs.license.current?.click()}
                          >
                            <input type="file" ref={fileRefs.license} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'drivingLicense')} />
                            {formData.drivingLicense ? (
                              <>
                                <CheckCircle2 className="w-6 h-6 text-sky-500" />
                                {uploadProgress.drivingLicense > 0 && uploadProgress.drivingLicense < 100 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                    <div className="h-full bg-sky-500" style={{ width: `${uploadProgress.drivingLicense}%` }} />
                                  </div>
                                )}
                              </>
                            ) : <Briefcase className="w-6 h-6 text-slate-600 mb-1" />}
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">License</span>
                          </div>
                          <div
                            className="h-28 border-2 border-dashed border-white/10 bg-white/5 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-center p-2 relative overflow-hidden"
                            onClick={() => fileRefs.selfie.current?.click()}
                          >
                            <input type="file" ref={fileRefs.selfie} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie')} />
                            {formData.selfie ? (
                              <>
                                <CheckCircle2 className="w-6 h-6 text-sky-500" />
                                {uploadProgress.selfie > 0 && uploadProgress.selfie < 100 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                    <div className="h-full bg-sky-500" style={{ width: `${uploadProgress.selfie}%` }} />
                                  </div>
                                )}
                              </>
                            ) : <UserCircle className="w-6 h-6 text-slate-600 mb-1" />}
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Selfie</span>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bank Info (RIB / IBAN)</Label>
                        <div className="relative group">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input id="bankInfo" value={formData.bankInfo} onChange={handleInputChange} className="pl-14 h-14 bg-accent/30 border-border rounded-2xl text-foreground font-mono tracking-wider" placeholder="MA99 0000 0000 0000 0000 0000" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-6 rounded-3xl bg-success/5 border border-success/10 text-success">
                      <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                      <p className="text-xs font-bold italic leading-relaxed">
                        Your data is encrypted and secure. We use bank-level security to protect your sensitive documents.
                      </p>
                    </div>

                    <div className="pt-4 flex flex-col md:flex-row gap-4">
                      <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="h-14 flex-1 bg-accent/30 border-border hover:bg-accent/50 text-foreground font-black text-xl rounded-2xl"
                      >
                        <ArrowLeft className="w-5 h-5 mr-3" /> Vehicle Info
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !isStep3Valid()}
                        className="h-14 flex-[2] bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xl rounded-2xl shadow-xl shadow-primary/10 group transition-all"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          "Submit Registration"
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <Link to="/login" className="hover:text-primary transition-colors">Partner Log In</Link>
            <span className="w-1 h-1 rounded-full bg-border" />
            <Link to="/help" className="hover:text-primary transition-colors">Support Center</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DriverRegistration;



