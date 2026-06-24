import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, updatePassword } from '@/services/api/authService';
import userService from '@/services/api/userService';
import { validatePassword, validatePhone } from '@/utils/validation';

import { supabase, BUCKETS } from '@/lib/supabase';



import agencyService from '@/services/api/agencyService';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Save, 
  Loader2, 
  Mail, 
  Phone, 
  UserCircle,
  Briefcase,
  Truck,
  CreditCard,
  Hash,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Upload,
  Camera,
  X,
  Building2,
  MapPin,
  Globe,
  Image as ImageIcon
} from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';


import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Settings = () => {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    taxId: '',
    vehicleType: '',
    vehiclePlate: '',
    licenseNumber: '',
  });

  const [agencyFormData, setAgencyFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    city: '',
    zipCode: '',
    country: '',
  });

  const [isAgencyLoading, setIsAgencyLoading] = useState(false);

  const [securityData, setSecurityData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        companyName: user.companyName || '',
        taxId: user.taxId || '',
        vehicleType: user.vehicleType || '',
        vehiclePlate: user.vehiclePlate || '',
        licenseNumber: user.licenseNumber || '',
      });

      if (user?.role === 'AGENCY' || user?.role === 'AGENCY_ADMIN') {
        fetchAgencySettings();
      }
    }
  }, [user]);

  const fetchAgencySettings = async () => {
    try {
      const data = await agencyService.getSettings();
      setAgencyFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        taxId: data.taxId || '',
        city: data.city || '',
        zipCode: data.zipCode || '',
        country: data.country || '',
      });
    } catch (error) {
      console.error("Failed to fetch agency settings", error);
    }
  };

  const handleAgencyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAgencyFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAgencyLoading(true);
    try {
      await agencyService.updateSettings(agencyFormData);
      toast({
        title: "Company Updated",
        description: "Your agency information has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update agency settings.",
        variant: "destructive",
      });
    } finally {
      setIsAgencyLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [id]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    // Frontend Validation
    const errors: Record<string, string> = {};
    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";
    
    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please check the highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        companyName: formData.companyName,
        taxId: formData.taxId,
        vehicleType: formData.vehicleType,
        vehiclePlate: formData.vehiclePlate,
        licenseNumber: formData.licenseNumber,
      };

      await updateProfile(payload);
      
      if (setUser) {
        setUser({
          ...user!,
          ...payload
        });
      }
      
      toast({
        title: "Profile Updated",
        description: "Your personal and business information has been saved successfully.",
      });
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Map backend validation errors (e.g., { "phoneNumber": "Invalid format" })
        setFormErrors(error.response.data.errors);
        toast({
          title: "Update Failed",
          description: "Input validation failed. Please fix the errors below.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Update Failed",
          description: error.response?.data?.message || "There was a problem updating your profile.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }

  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!securityData.oldPassword || !securityData.newPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    const passwordError = validatePassword(securityData.newPassword);
    if (passwordError) {
      toast({
        title: "Validation Error",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }


    setIsPasswordLoading(true);
    try {
      await updatePassword({
        oldPassword: securityData.oldPassword,
        newPassword: securityData.newPassword,
      });
      
      toast({
        title: "Password Updated",
        description: "Your security credentials have been updated successfully.",
      });
      setSecurityData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "The password update failed. Please check your current password.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image size must be less than 2MB.",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image size must be less than 2MB.",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSubmit = async () => {
    if (!avatarFile) {
      toast({
        title: "No Image Selected",
        description: "Please select an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsAvatarLoading(true);
    try {
      if (!user) throw new Error("User not authenticated");

      // 1. Generate unique file path: userId/timestamp.ext
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 2. Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from(BUCKETS.AVATARS)
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 3. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKETS.AVATARS)
        .getPublicUrl(fileName);

      // 4. Save URL to Backend using the new service
      // Requirements: Send avatarUrl to backend
      const response = await userService.updateAvatar(publicUrl);
      
      if (setUser && user) {
        setUser({
          ...user,
          avatarUrl: response.avatarUrl
        });
      }

      toast({
        title: "Avatar Updated",
        description: "Your new profile picture has been uploaded successfully.",
      });
      setAvatarFile(null); 
      setAvatarPreview(null);

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was a problem uploading your avatar.",
        variant: "destructive",
      });
    } finally {
      setIsAvatarLoading(false);
    }

  };

  const [activeTab, setActiveTab] = useState('profile');

  const tabVariants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 }
  };

  const isDriver = user?.role === 'DRIVER';
  const isCustomer = user?.role === 'CUSTOMER';
  const isAgency = user?.role === 'AGENCY' || user?.role === 'AGENCY_ADMIN';

  return (
    <div className="min-h-screen mesh-gradient py-4 px-4 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <div className="flex flex-col items-center text-center gap-1 mb-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-12 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Account Control</span>
            <div className="w-12 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground text-gradient py-2">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl font-medium">
            Fine-tune your experience, secure your account, and manage your professional profile on CargoLink.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-center">
            <TabsList className="bg-white/5 backdrop-blur-2xl p-1 rounded-[2rem] h-auto flex-wrap justify-center relative border border-white/10 shadow-xl">
              {[
                { id: 'profile', label: 'Profile', icon: UserCircle },
                { id: 'avatar', label: 'Avatar', icon: Camera },
                { id: 'security', label: 'Security', icon: ShieldCheck },
                ...(isAgency ? [{ id: 'company', label: 'Company', icon: Building2 }] : []),
                { id: 'notifications', label: 'Notifications', icon: Bell },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className={`relative rounded-[1.5rem] px-6 py-3 flex items-center gap-2 transition-all z-10 font-black text-xs uppercase tracking-wider ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground'}`} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,122,255,0.4)] z-[-1]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full"
            >

          <TabsContent value="profile" forceMount className="mt-0 outline-none space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Main Form Area */}
                <div className="space-y-6">
                  {/* Personal Information Card */}
                  <Card className="premium-glass border-none shadow-xl rounded-[1.5rem] overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xl font-black flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                          <UserCircle className="w-4 h-4" />
                        </div>
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-sm font-medium mt-1">
                        Your essential identity and communication preferences.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 group">
                          <Label htmlFor="firstName" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={handleInputChange}
                             className={`h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base px-6 border-2 ${formErrors.firstName ? 'border-red-500/50 focus:border-red-500' : 'focus:border-primary/50'}`}
                           />
                           {formErrors.firstName && <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.firstName}</p>}
                         </div>
                         <div className="space-y-2 group">
                           <Label htmlFor="lastName" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Last Name</Label>
                           <Input
                             id="lastName"
                             placeholder="Doe"
                             value={formData.lastName}
                             onChange={handleInputChange}
                             className={`h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base px-6 border-2 ${formErrors.lastName ? 'border-red-500/50 focus:border-red-500' : 'focus:border-primary/50'}`}
                           />
                           {formErrors.lastName && <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.lastName}</p>}
                         </div>

                      </div>

                      <div className="space-y-2 group">
                        <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            readOnly
                            className="pl-12 h-10 bg-white/[0.02] border-white/5 rounded-2xl cursor-not-allowed text-muted-foreground/60 font-bold text-base border-2"
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2">
                             <ShieldCheck className="w-4 h-4 text-green-500/50" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 group">
                        <Label htmlFor="phoneNumber" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="phoneNumber"
                            placeholder="+212 600 000 000"
                             value={formData.phoneNumber}
                             onChange={handleInputChange}
                             className={`pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 ${formErrors.phoneNumber ? 'border-red-500/50 focus:border-red-500' : 'focus:border-primary/50'}`}
                           />
                         </div>
                         {formErrors.phoneNumber && <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.phoneNumber}</p>}
                       </div>

                    </CardContent>
                  </Card>

                  {/* Business/Professional Information Card */}
                  {(isCustomer || isDriver) && (
                    <Card className="premium-glass border-none shadow-xl rounded-[1.5rem] overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            {isCustomer ? <Briefcase className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                          </div>
                          {isCustomer ? 'Business Entity' : 'Fleet Info'}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium mt-1">
                          {isCustomer 
                            ? 'Corporate details for seamless billing and enterprise logistics.' 
                            : 'Maintain your vehicle specifications and professional credentials.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-4">
                        {isCustomer && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                              <Label htmlFor="companyName" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Company Name</Label>
                              <div className="relative">
                                <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                <Input
                                  id="companyName"
                                  placeholder="CargoLink Inc."
                                  value={formData.companyName}
                                  onChange={handleInputChange}
                                  className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                                />
                              </div>
                            </div>
                            <div className="space-y-2 group">
                              <Label htmlFor="taxId" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Tax ID / ICE</Label>
                              <div className="relative">
                                <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                <Input
                                  id="taxId"
                                  placeholder="123456789"
                                  value={formData.taxId}
                                  onChange={handleInputChange}
                                  className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {isDriver && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2 group">
                                <Label htmlFor="vehicleType" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Vehicle Type</Label>
                                <div className="relative">
                                  <Truck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                  <Select
                                    value={formData.vehicleType || ''}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicleType: value }))}
                                  >
                                    <SelectTrigger className="pl-12 h-12 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50">
                                      <SelectValue placeholder="Truck / Van / Motorcycle" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10 bg-slate-950/95">
                                      <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                                      <SelectItem value="Van">Van</SelectItem>
                                      <SelectItem value="Truck">Truck</SelectItem>
                                      <SelectItem value="Car">Car</SelectItem>
                                      <SelectItem value="Cargo Bike">Cargo Bike</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-2 group">
                                <Label htmlFor="vehiclePlate" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">License Plate</Label>
                                <div className="relative">
                                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                  <Input
                                    id="vehiclePlate"
                                    placeholder="ABC-123"
                                    value={formData.vehiclePlate}
                                    onChange={handleInputChange}
                                    className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2 group">
                              <Label htmlFor="licenseNumber" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Driver's License Number</Label>
                              <div className="relative">
                                <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                <Input
                                  id="licenseNumber"
                                  placeholder="L-123456789"
                                  value={formData.licenseNumber}
                                  onChange={handleInputChange}
                                  className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      onClick={handleSubmit}
                      disabled={isLoading}
                      variant="premium"
                      size="premium"
                      className="w-full md:w-auto"
                    >
                      {isLoading ? "Synchronizing..." : "Save Profile Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="avatar" forceMount className="mt-0 outline-none">
            {activeTab === 'avatar' && (
              <Card className="premium-glass border-none shadow-2xl rounded-[2rem] overflow-hidden max-w-2xl mx-auto">
                <CardHeader className="p-4">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    Account Identity
                  </CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">
                    Visual representation helps clients and administrators recognize you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col items-center gap-12">
                  {/* Current/Preview Avatar */}
                  <div className="relative">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-48 h-48 rounded-[3rem] bg-gradient-to-br from-primary/10 to-primary/5 p-1 flex items-center justify-center border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative"
                    >
                      <div className="w-full h-full">
                        {avatarPreview ? (
                          <img src={avatarPreview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <UserAvatar user={user} className="w-full h-full rounded-none" />
                        )}
                      </div>

                      
                      {isAvatarLoading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                           <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                      )}
                    </motion.div>
                    
                    {avatarFile && !isAvatarLoading && (
                      <motion.button 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-2xl hover:bg-red-600 transition-colors z-30"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>

                  {/* Upload Dropzone */}
                  <div className="w-full">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`
                        relative border-2 border-dashed rounded-[2rem] p-10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer
                        ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-white/10 hover:border-primary/40 hover:bg-white/5'}
                      `}
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <div className="w-16 h-11 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black tracking-tight">Drop your image here</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">PNG, JPG or WebP (Max 2MB)</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAvatarSubmit}
                    disabled={!avatarFile || isAvatarLoading}
                    variant="premium"
                    size="premium"
                    className="w-full md:w-auto"
                  >
                    {isAvatarLoading ? "Synchronizing..." : "Confirm Visual Identity"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" forceMount className="mt-0 outline-none">
            {activeTab === 'security' && (
              <Card className="premium-glass border-none shadow-2xl rounded-[2rem] overflow-hidden max-w-3xl mx-auto">
                <CardHeader className="p-4">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    Security Matrix
                  </CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">
                    Strengthen your defensive perimeter with an encrypted credential update.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-10">
                  <form onSubmit={handleSecuritySubmit} className="space-y-10">
                    <div className="space-y-4 group">
                      <Label htmlFor="oldPassword" class-id="old-pass-label" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Current Security Key</Label>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="oldPassword"
                          type={showOldPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={securityData.oldPassword}
                          onChange={handleSecurityChange}
                          className="pl-12 pr-14 h-11 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 transition-all font-bold text-lg border-2 focus:border-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                        >
                          {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4 group">
                        <Label htmlFor="newPassword" class-id="new-pass-label" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">New Security Key</Label>
                        <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={securityData.newPassword}
                            onChange={handleSecurityChange}
                            className="pl-12 pr-14 h-11 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 transition-all font-bold text-lg border-2 focus:border-primary/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4 group">
                        <Label htmlFor="confirmPassword" class-id="confirm-pass-label" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Confirm Key</Label>
                        <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={securityData.confirmPassword}
                            onChange={handleSecurityChange}
                            className="pl-12 pr-14 h-11 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 transition-all font-bold text-lg border-2 focus:border-primary/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    onClick={handleSecuritySubmit}
                    disabled={isPasswordLoading}
                    variant="premium"
                    size="premium"
                    className="w-full md:w-auto"
                  >
                    {isPasswordLoading ? "Encrypting..." : "Finalize Security Update"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="company" forceMount className="mt-0 outline-none">
            {activeTab === 'company' && (
              <div className="space-y-6">
                <Card className="premium-glass border-none shadow-xl rounded-[1.5rem] overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xl font-black flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                        <Building2 className="w-4 h-4" />
                      </div>
                      Company Profile
                    </CardTitle>
                    <CardDescription className="text-sm font-medium mt-1">
                      Manage your agency's public profile and legal information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 group">
                        <Label htmlFor="name" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Agency Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="name"
                            placeholder="CargoLink Express"
                            value={agencyFormData.name}
                            onChange={handleAgencyInputChange}
                            className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="taxId" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Tax ID / ICE</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="taxId"
                            placeholder="123456789"
                            value={agencyFormData.taxId}
                            onChange={handleAgencyInputChange}
                            className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 group">
                        <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Business Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="contact@agency.com"
                            value={agencyFormData.email}
                            onChange={handleAgencyInputChange}
                            className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="phone" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Business Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="phone"
                            placeholder="+212 5XX XX XX XX"
                            value={agencyFormData.phone}
                            onChange={handleAgencyInputChange}
                            className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="address" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Headquarters Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="address"
                          placeholder="123 Logistics Ave, Business District"
                          value={agencyFormData.address}
                          onChange={handleAgencyInputChange}
                          className="pl-12 h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base border-2 focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 group">
                        <Label htmlFor="city" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">City</Label>
                        <Input
                          id="city"
                          placeholder="Casablanca"
                          value={agencyFormData.city}
                          onChange={handleAgencyInputChange}
                          className="h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base px-6 border-2 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="zipCode" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Zip Code</Label>
                        <Input
                          id="zipCode"
                          placeholder="20000"
                          value={agencyFormData.zipCode}
                          onChange={handleAgencyInputChange}
                          className="h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base px-6 border-2 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="country" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Country</Label>
                        <Input
                          id="country"
                          placeholder="Morocco"
                          value={agencyFormData.country}
                          onChange={handleAgencyInputChange}
                          className="h-10 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 focus:bg-white/[0.08] transition-all font-bold text-base px-6 border-2 focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      onClick={handleAgencySubmit}
                      disabled={isAgencyLoading}
                      variant="premium"
                      size="premium"
                      className="w-full md:w-auto"
                    >
                      {isAgencyLoading ? "Synchronizing..." : "Save Company Information"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" forceMount className="mt-0 outline-none">
            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="premium-glass border-none shadow-2xl rounded-[3rem] p-20 text-center flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center mb-8 shadow-inner">
                    <Bell className="w-10 h-10 text-primary opacity-40 animate-pulse" />
                  </div>
                  <CardTitle className="text-3xl font-black tracking-tight mb-2">Protocol Pending</CardTitle>
                  <CardDescription className="text-base font-medium max-w-sm">
                    Advanced notification filtering and priority routing protocols are currently being established.
                  </CardDescription>
                  <Button variant="outline" className="mt-10 rounded-2xl px-10 border-white/10 hover:bg-white/5">
                    Notify Me on Launch
                  </Button>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </motion.div>
      </AnimatePresence>
    </Tabs>
  </motion.div>
</div>
  );
};

export default Settings;
