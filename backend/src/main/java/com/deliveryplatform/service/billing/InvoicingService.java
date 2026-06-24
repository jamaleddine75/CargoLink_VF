package com.deliveryplatform.service.billing;

import com.deliveryplatform.domain.entity.billing.AgencyCustomerInvoice;
import com.deliveryplatform.dto.billing.InvoiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface InvoicingService {
    AgencyCustomerInvoice createInvoice(UUID agencyId, InvoiceRequest request);
    AgencyCustomerInvoice getInvoice(UUID agencyId, UUID invoiceId);
    Page<AgencyCustomerInvoice> getInvoices(UUID agencyId, Pageable pageable);
    AgencyCustomerInvoice sendInvoice(UUID agencyId, UUID invoiceId);
    byte[] generateInvoicePdf(UUID agencyId, UUID invoiceId);
    void updateInvoiceStatus(UUID invoiceId);
}
