package com.vibepass.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class QrCodeService {

    private static final int QR_WIDTH = 250;
    private static final int QR_HEIGHT = 250;

    public String generateQrCodeBase64(String ticketReference)
            throws WriterException, IOException {

        if (ticketReference == null || ticketReference.isBlank()) {
            throw new IllegalArgumentException(
                    "Ticket reference cannot be empty"
            );
        }

        // The QR code contains the ticket reference,
        // not payment details or personal information.
        String qrContent = "VIBEPASS:TICKET:" + ticketReference;

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.MARGIN, 2);

        QRCodeWriter qrCodeWriter = new QRCodeWriter();

        BitMatrix bitMatrix = qrCodeWriter.encode(
                qrContent,
                BarcodeFormat.QR_CODE,
                QR_WIDTH,
                QR_HEIGHT,
                hints
        );

        try (ByteArrayOutputStream outputStream =
                     new ByteArrayOutputStream()) {

            MatrixToImageWriter.writeToStream(
                    bitMatrix,
                    "PNG",
                    outputStream
            );

            return Base64.getEncoder()
                    .encodeToString(outputStream.toByteArray());
        }
    }
}