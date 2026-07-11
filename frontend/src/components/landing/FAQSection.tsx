import React from "react";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Which cities are supported by CargoLink?",
    answer:
      "CargoLink operates exclusively within the Tanger-Tetouan-Al Hoceima region. The currently supported operational cities are Fnideq, Tetouan, Mdiq, Tanger, and Chaouen. Shipping rates, regional routing, and driver pools are locked to these 5 active nodes.",
  },
  {
    question: "How does Cash on Delivery (COD) wallet settlement work?",
    answer:
      "Couriers collect cash directly from package recipients. The collected cash-on-delivery amount is logged as pending in the driver's mobile wallet. Driver balances are reconciled and settled with the agency wallet when physical cash is deposited at the hub.",
  },
  {
    question: "How are driver partners validated?",
    answer:
      "Safety is central to our platform. Drivers register via the Driver Registration page, uploading government ID cards, driving licenses, and vehicle insurance certificates. System administrators must manually validate these documents in the admin portal before couriers can accept active dispatch route offers.",
  },
  {
    question: "Does the courier mobile app support offline actions?",
    answer:
      "Yes. The courier companion interface caches active route logs, package checklist status changes, and QR scan data locally on the device. All actions sync with the main database automatically once a cellular network connection is established.",
  },
  {
    question: "How are shipping rates calculated?",
    answer:
      "Shipping costs are calculated automatically when a customer creates an order. Standard base rates apply between our active shipping hubs, with fixed surcharges applied for urgent dispatches or heavy cargo handling.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 bg-background border-t border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">FAQ</h2>
          <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Find answers to common questions about CargoLink's regional logistics network, security compliance, and courier operations.
          </p>
        </div>

        {/* Accordions */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-lg border border-border bg-card px-5 hover:border-primary/20 transition-all duration-200"
            >
              <AccordionTrigger className="py-4 text-left hover:no-underline hover:bg-transparent">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold text-xs text-foreground">
                    {faq.question}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 pr-2 pb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
