package com.deliveryplatform.service.billing.impl;

import com.deliveryplatform.domain.entity.Agency;
import com.deliveryplatform.domain.entity.AgencyCustomer;
import com.deliveryplatform.domain.entity.Order;
import com.deliveryplatform.domain.entity.billing.AgencyCustomerInvoice;
import com.deliveryplatform.domain.entity.billing.InvoiceStatus;
import com.deliveryplatform.dto.billing.InvoiceRequest;
import com.deliveryplatform.exception.ResourceNotFoundException;
import com.deliveryplatform.repository.AgencyCustomerRepository;
import com.deliveryplatform.repository.AgencyRepository;
import com.deliveryplatform.repository.OrderRepository;
import com.deliveryplatform.repository.billing.AgencyCustomerInvoiceRepository;
import com.deliveryplatform.service.billing.InvoicingService;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoicingServiceImpl implements InvoicingService {

    private final AgencyCustomerInvoiceRepository invoiceRepository;
    private final AgencyRepository agencyRepository;
    private final AgencyCustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public AgencyCustomerInvoice createInvoice(UUID agencyId, InvoiceRequest request) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency", "id", agencyId));
        
        AgencyCustomer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("AgencyCustomer", "id", request.getCustomerId()));

        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));
        }

        String invoiceNumber = generateInvoiceNumber(agencyId);

        BigDecimal totalAmount = request.getSubtotal()
                .add(request.getTaxAmount())
                .subtract(request.getDiscountAmount());

        AgencyCustomerInvoice invoice = AgencyCustomerInvoice.builder()
                .invoiceNumber(invoiceNumber)
                .agency(agency)
                .customer(customer)
                .order(order)
                .issueDate(LocalDateTime.now())
                .dueDate(request.getDueDate())
                .subtotal(request.getSubtotal())
                .taxAmount(request.getTaxAmount())
                .discountAmount(request.getDiscountAmount())
                .totalAmount(totalAmount)
                .amountDue(totalAmount)
                .amountPaid(BigDecimal.ZERO)
                .status(InvoiceStatus.DRAFT)
                .notes(request.getNotes())
                .build();

        return invoiceRepository.save(invoice);
    }

    @Override
    public AgencyCustomerInvoice getInvoice(UUID agencyId, UUID invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .filter(inv -> inv.getAgency().getId().equals(agencyId))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));
    }

    @Override
    public Page<AgencyCustomerInvoice> getInvoices(UUID agencyId, Pageable pageable) {
        // We'll need a custom query in repository or use Specifications
        // For now, let's assume a basic findByAgencyId
        return invoiceRepository.findAll((root, query, cb) -> cb.equal(root.get("agency").get("id"), agencyId), pageable);
    }

    @Override
    @Transactional
    public AgencyCustomerInvoice sendInvoice(UUID agencyId, UUID invoiceId) {
        AgencyCustomerInvoice invoice = getInvoice(agencyId, invoiceId);
        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            invoice.setStatus(InvoiceStatus.SENT);
            return invoiceRepository.save(invoice);
        }
        return invoice;
    }

    @Override
    public byte[] generateInvoicePdf(UUID agencyId, UUID invoiceId) {
        AgencyCustomerInvoice invoice = getInvoice(agencyId, invoiceId);
        
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            // Font styles
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            // Title
            Paragraph platformName = new Paragraph("CargoLink Platform", headerFont);
            platformName.setAlignment(Element.ALIGN_LEFT);
            document.add(platformName);

            Paragraph title = new Paragraph("INVOICE", headerFont);
            title.setAlignment(Element.ALIGN_RIGHT);
            document.add(title);

            // Agency Info
            document.add(new Paragraph("From:", subHeaderFont));
            document.add(new Paragraph(invoice.getAgency().getName(), normalFont));
            document.add(new Paragraph(invoice.getAgency().getAddress(), normalFont));
            document.add(new Paragraph(" ", normalFont));

            // Customer Info
            document.add(new Paragraph("To:", subHeaderFont));
            document.add(new Paragraph(invoice.getCustomer().getFullName(), normalFont));
            document.add(new Paragraph(invoice.getCustomer().getAddress(), normalFont));
            document.add(new Paragraph(" ", normalFont));

            // Invoice Details
            PdfPTable detailsTable = new PdfPTable(2);
            detailsTable.setWidthPercentage(40);
            detailsTable.setHorizontalAlignment(Element.ALIGN_LEFT);
            
            detailsTable.addCell(createCell("Invoice Number:", subHeaderFont));
            detailsTable.addCell(createCell(invoice.getInvoiceNumber(), normalFont));
            detailsTable.addCell(createCell("Date:", subHeaderFont));
            detailsTable.addCell(createCell(invoice.getIssueDate().format(DateTimeFormatter.ISO_LOCAL_DATE), normalFont));
            detailsTable.addCell(createCell("Due Date:", subHeaderFont));
            detailsTable.addCell(createCell(invoice.getDueDate() != null ? invoice.getDueDate().format(DateTimeFormatter.ISO_LOCAL_DATE) : "N/A", normalFont));
            
            document.add(detailsTable);
            document.add(new Paragraph(" ", normalFont));

            // Items Table
            PdfPTable itemsTable = new PdfPTable(2);
            itemsTable.setWidthPercentage(100);
            itemsTable.addCell(createCell("Description", subHeaderFont));
            itemsTable.addCell(createCell("Amount", subHeaderFont));

            String desc = "Delivery Service";
            if (invoice.getOrder() != null) {
                desc += " - Order #" + invoice.getOrder().getTrackingNumber();
            }
            itemsTable.addCell(createCell(desc, normalFont));
            itemsTable.addCell(createCell(invoice.getSubtotal().toString() + " MAD", normalFont));
            
            document.add(itemsTable);
            document.add(new Paragraph(" ", normalFont));

            // Totals
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(40);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            totalsTable.addCell(createCell("Subtotal:", normalFont));
            totalsTable.addCell(createCell(invoice.getSubtotal().toString() + " MAD", normalFont));
            totalsTable.addCell(createCell("Tax:", normalFont));
            totalsTable.addCell(createCell(invoice.getTaxAmount().toString() + " MAD", normalFont));
            totalsTable.addCell(createCell("Discount:", normalFont));
            totalsTable.addCell(createCell("-" + invoice.getDiscountAmount().toString() + " MAD", normalFont));
            totalsTable.addCell(createCell("Total:", subHeaderFont));
            totalsTable.addCell(createCell(invoice.getTotalAmount().toString() + " MAD", subHeaderFont));
            totalsTable.addCell(createCell("Amount Paid:", normalFont));
            totalsTable.addCell(createCell(invoice.getAmountPaid().toString() + " MAD", normalFont));
            totalsTable.addCell(createCell("Balance Due:", subHeaderFont));
            totalsTable.addCell(createCell(invoice.getAmountDue().toString() + " MAD", subHeaderFont));

            document.add(totalsTable);

            // Footer / Notes
            if (invoice.getNotes() != null && !invoice.getNotes().isEmpty()) {
                document.add(new Paragraph("Notes:", subHeaderFont));
                document.add(new Paragraph(invoice.getNotes(), normalFont));
            }

            document.add(new Paragraph(" ", normalFont));
            Paragraph footer = new Paragraph("Thank you for your business!", normalFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF", e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    @Override
    @Transactional
    public void updateInvoiceStatus(UUID invoiceId) {
        AgencyCustomerInvoice invoice = invoiceRepository.findById(invoiceId).orElseThrow();
        if (invoice.getAmountPaid().compareTo(BigDecimal.ZERO) == 0) {
            // keep as SENT or DRAFT?
        } else if (invoice.getAmountPaid().compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }
        invoiceRepository.save(invoice);
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        return cell;
    }

    private String generateInvoiceNumber(UUID agencyId) {
        // Format: INV-AGENCY_SHORT_ID-TIMESTAMP-RANDOM
        return "INV-" + agencyId.toString().substring(0, 5).toUpperCase() + "-" + System.currentTimeMillis() % 1000000;
    }
}
