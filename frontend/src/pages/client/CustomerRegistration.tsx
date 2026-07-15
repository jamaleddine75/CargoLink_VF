import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Mail, Lock, Phone, ArrowRight, ArrowLeft,
  Upload, CheckCircle2, Loader2, Eye, EyeOff,
  Globe, ShieldCheck, Briefcase,
  Truck, Check, Calendar, UserCircle, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CargoMap from '@/components/common/CargoMap';
import { register as authRegister } from '@/services/api/authService';
import { UserRole } from '@/types';
import { validatePassword } from '@/utils/validation';
import CitySelector from '@/components/common/CitySelector';
import { Search } from 'lucide-react';




const CustomerRegistration = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    postalCode: '',
    dob: '',
    gender: '',
    location: null as { lat: number; lng: number } | null,
    files: [] as File[],
    acceptedTerms: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const [isLocating, setIsLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();




  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleLocationChange = (pos: { lat: number; lng: number }) => {
    setFormData(prev => ({ ...prev, location: pos }));
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationChange({ lat: latitude, lng: longitude });
        toast.success('Location captured! You can adjust it on the map.', {
          duration: 3000
        });
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Could not get your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable it in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out.';
        }
        toast.error(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Automatic Geocoding Effect
  React.useEffect(() => {
    if (step !== 2) return;

    const query = `${formData.address} ${formData.city} ${formData.postalCode} Morocco`.trim();
    if (query.length < 15) return; // Only search if we have enough info

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
          
          // Only update if it's significantly different
          if (!formData.location || 
              Math.abs(formData.location.lat - newPos.lat) > 0.001 || 
              Math.abs(formData.location.lng - newPos.lng) > 0.001) {
            handleLocationChange(newPos);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [formData.address, formData.city, formData.postalCode, step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };


  const isStep1Valid = () => {
    const { fullName, businessName, phone, email, password, confirmPassword, dob, gender } = formData;
    return (
      fullName.length >= 2 &&
      businessName.length >= 2 &&
      phone.length >= 8 &&
      /\S+@\S+\.\S+/.test(email) &&
      !validatePassword(password) &&
      password === confirmPassword &&
      dob !== '' &&
      gender !== ''
    );

  };

  const isStep2Valid = () => {
    const { address, city, postalCode } = formData;
    return address.length > 3 && city.length > 2 && postalCode.length >= 4;
  };

  const handleNext = () => {
    if (isStep1Valid()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep2Valid()) return;

    setIsLoading(true);
    
    try {
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';

      if (!formData.acceptedTerms) {
        toast.error('Please accept the terms and conditions');
        return;
      }

      await authRegister({
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        role: 'CUSTOMER' as UserRole,
        phoneNumber: formData.phone,
        companyName: formData.businessName,
        city: formData.city,
        address: formData.address,
        latitude: formData.location?.lat,
        longitude: formData.location?.lng,
        gender: formData.gender,
        dateOfBirth: formData.dob,
        documents: formData.files.length > 0 ? formData.files.map(f => f.name).join(', ') : undefined
      });


      toast.success('Registration request sent!', {
        description: 'Your account is pending validation by an administrator.',
        duration: 8000,
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const message = (error as any).response?.data?.message || 'Error during registration. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground font-sans py-8 px-4 relative">
      <Link 
        to="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors z-20 uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[800px] space-y-6"
      >
        {/* Logo & Header */}
        <div className="text-center">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 mb-2"
            >
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                    <Truck className="w-5 h-5" />
                </div>
                <span className="text-2xl font-semibold tracking-tight text-foreground">CargoLink</span>
            </motion.div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Become a Customer</h1>
            <p className="text-xs text-muted-foreground mt-1">Join our delivery network in seconds</p>
        </div>

        {/* Form Card */}
        <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>Business</span>
                </div>
                <div className={`w-12 h-[2px] rounded-full transition-colors duration-300 ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        2
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>Location</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground ml-1">Full Name</Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                      <Briefcase className="w-4 h-4" />
                                    </div>
                                    <input id="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" placeholder="e.g., John Doe" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="businessName" className="text-xs font-semibold text-muted-foreground ml-1">Business Name</Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                      <Building2 className="w-4 h-4" />
                                    </div>
                                    <input id="businessName" value={formData.businessName} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" placeholder="e.g., Central Pharmacy" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground ml-1">Phone Number</Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                      <Phone className="w-4 h-4" />
                                    </div>
                                    <input id="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" placeholder="06XXXXXXXX" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground ml-1">Email Address</Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                      <Mail className="w-4 h-4" />
                                    </div>
                                    <input id="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" placeholder="contact@example.com" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" title="customer-pass" className="text-xs font-semibold text-muted-foreground ml-1">Password</Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                      <Lock className="w-4 h-4" />
                                    </div>
                                    <input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground ml-1">Confirm Password</Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                      <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="dob" className="text-xs font-semibold text-muted-foreground ml-1">Date of Birth</Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 z-10">
                                      <Calendar className="w-4 h-4" />
                                    </div>
                                    <input id="dob" type="date" value={formData.dob} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="gender" className="text-xs font-semibold text-muted-foreground ml-1">Gender</Label>
                                <Select onValueChange={(v) => handleSelectChange('gender', v)}>
                                    <SelectTrigger className="h-11 bg-background border border-border/60 rounded-xl text-foreground text-sm focus:ring-primary/20 focus:border-primary/50 transition-all px-4">
                                        <div className="flex items-center gap-3">
                                            <UserCircle className="w-4 h-4 text-muted-foreground" />
                                            <SelectValue placeholder="Select gender" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                              type="button"
                              onClick={handleNext}
                              disabled={!isStep1Valid()}
                              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Continue <ArrowRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="address" className="text-xs font-semibold text-muted-foreground ml-1">Full Address</Label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                      <Globe className="w-4 h-4" />
                                    </div>
                                    <input id="address" value={formData.address} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" placeholder="Street name, building number..." />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <CitySelector
                                  value={formData.city}
                                  onValueChange={(v) => handleSelectChange('city', v)}
                                  label="City"
                                />

                                <div className="space-y-1.5">
                                    <Label htmlFor="postalCode" className="text-xs font-semibold text-muted-foreground ml-1">Postal Code</Label>
                                    <input id="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full bg-background border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all" placeholder="20000" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <Label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-2">
                                    <span>Store Location</span>
                                    {formData.location && <span className="text-[10px] text-primary font-bold">Captured!</span>}
                                  </Label>
                                  <button
                                    type="button"
                                    onClick={handleLocateMe}
                                    disabled={isLocating}
                                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                  >
                                    {isLocating ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Locating...
                                      </>
                                    ) : (
                                      <>
                                        <MapPin className="w-3.5 h-3.5" />
                                        Locate Me
                                      </>
                                    )}
                                  </button>
                                </div>
                                <div className="rounded-xl border border-border/60 overflow-hidden h-[250px] shadow-sm relative group cursor-pointer">
                                    <CargoMap
                                        mode="PICKER"
                                        onLocationSelect={(lat, lng) => handleLocationChange({ lat, lng })}
                                        center={formData.location ? [formData.location.lat, formData.location.lng] : undefined}
                                        interactive={true}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground/70">💡 Click on the map to drop a pin, or use "Locate Me" for auto-detection</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-semibold text-muted-foreground ml-1">Documents (Optional)</Label>
                                <div 
                                  className="h-[150px] border border-dashed border-border/60 bg-muted/20 rounded-xl p-4 text-center hover:bg-muted/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".pdf,image/*" />
                                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                      <Upload className="w-4.5 h-4.5" />
                                  </div>
                                  <p className="text-xs font-semibold text-muted-foreground">Upload files</p>
                                  {formData.files.length > 0 && (
                                    <p className="text-[10px] font-bold text-primary">{formData.files.length} files selected</p>
                                  )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={formData.acceptedTerms}
                            onChange={(e) => setFormData(prev => ({ ...prev, acceptedTerms: e.target.checked }))}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 mt-0.5"
                          />
                          <label htmlFor="terms" className="text-xs font-semibold text-muted-foreground cursor-pointer leading-tight">
                            I accept the <a href="#terms" className="text-primary hover:underline">Terms and Conditions</a> and the <a href="#privacy" className="text-primary hover:underline">Privacy Policy</a> <span className="text-red-500">*</span>
                          </label>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                            <button
                              type="button"
                              onClick={handleBack}
                              className="w-full sm:w-auto font-semibold text-muted-foreground hover:text-foreground h-11 text-sm border border-border rounded-xl bg-background hover:bg-muted/50 px-4 transition-all"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2 inline" /> Back
                            </button>
                            <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={isLoading || !isStep2Valid() || !formData.acceptedTerms}
                              className="flex-1 w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                "Submit Request"
                              )}
                            </button>
                        </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Branding Footer */}
        <div className="text-center pt-2">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <Link to="/login" className="hover:text-primary transition-colors font-medium">Already a customer?</Link>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerRegistration;

