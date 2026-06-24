package com.deliveryplatform.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import lombok.extern.slf4j.Slf4j;



@Slf4j
public class BarcodeGenerator {

    public static String generateBarcode(String text, String fileName) {
        try {
            int width = 300;
            int height = 100;

            BitMatrix bitMatrix = new MultiFormatWriter().encode(text, BarcodeFormat.CODE_128, width, height);
            
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", baos);
            byte[] imageBytes = baos.toByteArray();
            
            String base64Image = java.util.Base64.getEncoder().encodeToString(imageBytes);
            String dataUrl = "data:image/png;base64," + base64Image;

            log.info("Barcode generated as Base64 for: {}", text);
            return dataUrl;
        } catch (Exception e) {
            log.error("Error generating barcode: ", e);
            throw new RuntimeException("Failed to generate barcode image", e);
        }
    }
}
