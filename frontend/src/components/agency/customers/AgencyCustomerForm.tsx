import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgencyCustomerRequest } from '@/services/api/agencyCustomerService';

const customerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  companyName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

interface AgencyCustomerFormProps {
  initialData?: Partial<AgencyCustomerRequest>;
  onSubmit: (data: AgencyCustomerRequest) => void;
  loading?: boolean;
}

export function AgencyCustomerForm({ initialData, onSubmit, loading }: AgencyCustomerFormProps) {
  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      companyName: initialData?.companyName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      city: initialData?.city || "",
      address: initialData?.address || "",
      notes: initialData?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60 text-[10px] font-black uppercase tracking-widest">Full Name *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-blue-500/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60 text-[10px] font-black uppercase tracking-widest">Company Name</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-blue-500/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60 text-[10px] font-black uppercase tracking-widest">Email Address *</FormLabel>
                <FormControl>
                  <Input {...field} type="email" className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-blue-500/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60 text-[10px] font-black uppercase tracking-widest">Phone Number *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-blue-500/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60 text-[10px] font-black uppercase tracking-widest">City</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-blue-500/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/60 text-[10px] font-black uppercase tracking-widest">Address</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-blue-500/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/60 text-[10px] font-black uppercase tracking-widest">Internal Notes</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-white/5 border-white/10 rounded-xl min-h-[100px] focus:ring-blue-500/20" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4 pt-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-500 h-12 px-8 rounded-xl font-bold transition-all active:scale-95" disabled={loading}>
            {loading ? "Processing..." : initialData ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
