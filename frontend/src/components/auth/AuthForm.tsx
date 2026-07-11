import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Mail, Lock, User, 
  Building2, MapPin, Calendar, 
  UserCircle2, ShieldCheck, Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required" }),
  company: z.string().optional(),
  vehicleType: z.string().optional(),
  region: z.string().min(2, { message: "Region/Area is required" }),
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  birthday: z.string().min(1, { message: "Birthday is required" }),
  gender: z.string().min(1, { message: "Gender is required" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface AuthFormProps {
  mode: 'login' | 'register';
  role: 'CUSTOMER' | 'DRIVER';
  onSubmit: (data: unknown) => Promise<void>;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, role, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<unknown>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues: {
      fullName: "",
      company: "",
      vehicleType: "",
      region: "",
      email: "",
      password: "",
      confirmPassword: "",
      birthday: "",
      gender: "",
    },
  });

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      const submissionData = { ...values, role };
      
      if (mode === 'register') {
        // Map fullName to firstName and lastName
        const nameParts = (submissionData.fullName || "").trim().split(" ");
        submissionData.firstName = nameParts[0] || "User";
        submissionData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Name";
        
        // Map region to city and address
        submissionData.city = submissionData.region;
        submissionData.address = submissionData.region; // Fallback since backend requires address
      }
      
      if (role === 'CUSTOMER') delete submissionData.vehicleType;
      if (role === 'DRIVER') delete submissionData.company;
      
      await onSubmit(submissionData);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-background border border-border/60 pl-10 pr-4 py-2.5 h-11 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <AnimatePresence mode="wait">
          {mode === 'register' ? (
            <motion.div
              key="register-grid"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3"
            >
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group text-sm">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Full Name" className={inputClasses} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />

              {role === 'CUSTOMER' ? (
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative group text-sm">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input placeholder="Company / Organization" className={inputClasses} {...field} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border border-border/60 h-11 rounded-xl text-foreground text-sm pl-10 focus:ring-primary/20 focus:border-primary/50 transition-all w-full">
                            <div className="flex items-center gap-3">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Vehicle Type" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                          <SelectItem value="bike">Bicycle / E-bike</SelectItem>
                          <SelectItem value="motorcycle">Motorcycle / Scooter</SelectItem>
                          <SelectItem value="car">Car (Sedan/SUV)</SelectItem>
                          <SelectItem value="van">Van / Small Truck</SelectItem>
                          <SelectItem value="heavy_truck">Heavy Truck</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                    </FormItem>
                  )}
                />
              )}

               <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group text-sm">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Region / Area" className={inputClasses} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group text-sm">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Email Address" className={inputClasses} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group text-sm">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input type="password" placeholder="Password" className={inputClasses} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group text-sm">
                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input type="password" placeholder="Confirm Password" className={inputClasses} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group text-sm">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input type="date" className={inputClasses} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border border-border/60 h-11 rounded-xl text-foreground text-sm pl-10 focus:ring-primary/20 focus:border-primary/50 transition-all w-full">
                           <div className="flex items-center gap-3">
                            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Gender" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />
            </motion.div>
          ) : (
            <motion.div
              key="login-fields"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group text-sm">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Email Address" className={inputClasses} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative group text-sm">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input type="password" placeholder="Password" className={inputClasses} {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 mt-1 ml-1" />
                  </FormItem>
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          type="submit" 
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 mt-4" 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            mode === 'login' ? 'Sign In' : 'Sign Up'
          )}
        </button>
      </form>
    </Form>
  );
};

