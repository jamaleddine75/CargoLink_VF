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
        longitude: formData.location?.lng
      });


      toast.success('Registration request sent!', {
        description: 'Your account is pending validation by an administrator.',
        duration: 8000,
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
      
      setTimeout(() => {
        navigate('/login/client');
      }, 3000);
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Error during registration. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans selection:bg-primary/30 py-2 px-4 transition-colors duration-500">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-gradient opacity-40 dark:opacity-60 ml-2" />
        <div className="absolute inset-0 grid-pattern opacity-20 dark:opacity-[0.4]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 dark:bg-primary/10 blur-[130px] rounded-full animate-pulse opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/5 dark:bg-blue-600/10 blur-[150px] rounded-full animate-pulse opacity-60" />
      </div>

      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors z-20 group uppercase tracking-widest"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[850px]"
      >
        {/* Logo & Header */}
        <div className="text-center mb-3 space-y-1">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 mb-2"
            >
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                    <Truck className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-foreground">CargoLink</span>
            </motion.div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Become a Customer</h1>
            <p className="text-muted-foreground font-medium">Join our delivery network in seconds</p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-2xl shadow-2xl rounded-[28px] overflow-hidden">
          <CardContent className="p-6 md:p-8">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step >= 1 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                        {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>Business</span>
                </div>
                <div className={`w-12 h-[2px] rounded-full transition-colors duration-300 ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step >= 2 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                        2
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>Location</span>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="fullName" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Full Name</Label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                                    <Input id="fullName" value={formData.fullName} onChange={handleInputChange} className="pl-12 h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10" placeholder="e.g., John Doe" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="businessName" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Business Name</Label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                                    <Input id="businessName" value={formData.businessName} onChange={handleInputChange} className="pl-12 h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10" placeholder="e.g., Central Pharmacy" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Phone Number</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                                    <Input id="phone" value={formData.phone} onChange={handleInputChange} className="pl-12 h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10" placeholder="06XXXXXXXX" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Email Address</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-12 h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10" placeholder="contact@example.com" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" title="customer-pass" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                                    <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} className="pl-12 h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Confirm Password</Label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleInputChange} className="pl-12 h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="dob" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Date of Birth</Label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors z-10" />
                                    <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} className="pl-12 h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10 dark:[color-scheme:dark]" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="gender" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Gender</Label>
                                <Select onValueChange={(v) => handleSelectChange('gender', v)}>
                                    <SelectTrigger className="h-12 bg-accent/20 border-border/60 rounded-xl transition-all focus:ring-4 focus:ring-primary/10">
                                        <div className="flex items-center gap-3">
                                            <UserCircle className="w-4.5 h-4.5 text-muted-foreground" />
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

                        <div className="pt-6">
                            <Button
                              onClick={handleNext}
                              disabled={!isStep1Valid()}
                              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 group transition-all"
                            >
                              Continue <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="address" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Full Address</Label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                                    <Input id="address" value={formData.address} onChange={handleInputChange} className="pl-12 h-12 bg-accent/20 border-border/60 rounded-xl transition-all" placeholder="Street name, building number..." />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <CitySelector
                                  value={formData.city}
                                  onValueChange={(v) => handleSelectChange('city', v)}
                                  label="City"
                                />


                                <div className="space-y-1.5">
                                    <Label htmlFor="postalCode" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Postal Code</Label>
                                    <Input id="postalCode" value={formData.postalCode} onChange={handleInputChange} className="h-12 bg-accent/20 border-border/60 rounded-xl" placeholder="20000" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                                    <span>Place a marker (Store Location)</span>
                                    {formData.location && <span className="text-[10px] text-primary font-bold">Captured!</span>}
                                  </Label>
                                  <Button
                                    type="button"
                                    onClick={handleLocateMe}
                                    disabled={isLocating}
                                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-md transition-all"
                                  >
                                    {isLocating ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Locating...
                                      </>
                                    ) : (
                                      <>
                                        <MapPin className="w-3 h-3" />
                                        Locate Me
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <div className="rounded-xl border border-border/60 overflow-hidden h-[250px] shadow-inner relative group cursor-pointer hover:shadow-lg transition-shadow">
                                    <CargoMap
                                        mode="PICKER"
                                        onLocationSelect={(lat, lng) => handleLocationChange({ lat, lng })}
                                        center={formData.location ? [formData.location.lat, formData.location.lng] : undefined}
                                        interactive={true}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground/60 font-medium">💡 Click on the map to drop a pin, or use "Locate Me" for auto-detection</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Documents (Optional)</Label>
                                <div 
                                  className="h-[150px] border-2 border-dashed border-border/60 bg-accent/15 rounded-xl p-4 text-center hover:bg-accent/25 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".pdf,image/*" />
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                      <Upload className="w-5 h-5" />
                                  </div>
                                  <p className="text-xs font-bold text-muted-foreground/70">Upload files</p>
                                  {formData.files.length > 0 && (
                                    <p className="text-[10px] font-black text-primary uppercase">{formData.files.length} selected</p>
                                  )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center gap-3 p-3 rounded-lg bg-accent/20 border border-border/60">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={formData.acceptedTerms}
                            onChange={(e) => setFormData(prev => ({ ...prev, acceptedTerms: e.target.checked }))}
                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600"
                          />
                          <label htmlFor="terms" className="text-xs font-semibold text-foreground cursor-pointer">
                            I accept the <a href="#terms" className="text-primary hover:underline">Terms and Conditions</a> and the <a href="#privacy" className="text-primary hover:underline">Privacy Policy</a> <span className="text-red-500">*</span>
                          </label>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
                            <Button
                              variant="ghost"
                              onClick={handleBack}
                              className="w-full sm:w-auto font-black text-muted-foreground hover:text-foreground h-12"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                              onClick={handleSubmit}
                              disabled={isLoading || !isStep2Valid() || !formData.acceptedTerms}
                              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 transition-all"
                            >
                              {isLoading ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                  <span>Processing...</span>
                                </div>
                              ) : (
                                "Submit Request"
                              )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Branding Footer */}
        <div className="mt-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                <Link to="/login/client" className="hover:text-primary transition-colors">Already a customer?</Link>
                <span className="w-1 h-1 rounded-full bg-border" />
                <Link to="/help" className="hover:text-primary transition-colors">Support</Link>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerRegistration;
