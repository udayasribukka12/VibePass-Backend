
package com.vibepass.backend.controller;

import com.google.zxing.WriterException;
import com.vibepass.backend.model.Booking;
import com.vibepass.backend.model.Event;
import com.vibepass.backend.repository.BookingRepository;
import com.vibepass.backend.repository.EventRepository;
import com.vibepass.backend.security.JwtAuthenticationFilter.UserIdentity;
import com.vibepass.backend.service.QrCodeService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(originPatterns = {
        "http://localhost:*",
        "http://127.0.0.1:*"
})
public class BookingController {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final QrCodeService qrCodeService;

    public BookingController(
            BookingRepository bookingRepository,
            EventRepository eventRepository,
            QrCodeService qrCodeService) {

        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.qrCodeService = qrCodeService;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null
                && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    private UserIdentity getIdentity(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal()
                instanceof UserIdentity)) {
            return null;
        }

        return (UserIdentity) authentication.getPrincipal();
    }

    // Compare IDs by value so Long and Integer representations do not cause
    // a false ownership failure (403 Forbidden).
    private boolean sameUserId(Object firstId, Object secondId) {
        return firstId != null
                && secondId != null
                && String.valueOf(firstId).equals(String.valueOf(secondId));
    }

    // 1. Create a booking
    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(
            @RequestBody Booking booking,
            Authentication authentication) {

        UserIdentity identity = getIdentity(authentication);

        if (identity == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        if (booking.getEventId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Event ID is required"));
        }

        Event event = eventRepository.findById(booking.getEventId())
                .orElse(null);

        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Event not found"));
        }

        Integer available = event.getAvailableTickets();

        if (available == null || available <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Event is sold out"));
        }

        // Set trusted booking details on the server
        booking.setUserId(identity.id());
        booking.setEventName(event.getName());
        booking.setEventCity(event.getCity());
        booking.setEventVenue(event.getVenue());
        booking.setEventDate(event.getEventDate());
        booking.setTicketPrice(event.getPrice());
        booking.setBookingStatus("CONFIRMED");

        // Demo bookings start unpaid
        booking.setPaymentStatus("UNPAID");

        event.setAvailableTickets(available - 1);
        eventRepository.save(event);

        Booking saved = bookingRepository.save(booking);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 2. Get all bookings (admin only)
    @GetMapping
    public ResponseEntity<?> getAllBookings(
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "Only admins can view all bookings"
                    ));
        }

        return ResponseEntity.ok(bookingRepository.findAll());
    }

    // 3. Get bookings for a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBookings(
            @PathVariable Long userId,
            Authentication authentication) {

        UserIdentity identity = getIdentity(authentication);

        if (identity == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        if (!isAdmin(authentication)
                && !sameUserId(identity.id(), userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You cannot view another user's bookings"
                    ));
        }

        return ResponseEntity.ok(
                bookingRepository.findByUserIdOrderByBookingDateDesc(userId)
        );
    }

    // 4. Demo payment confirmation
    // This simulates payment; it does NOT process real money.
    @PostMapping("/{bookingId}/demo-payment")
    @Transactional
    public ResponseEntity<?> confirmDemoPayment(
            @PathVariable Long bookingId,
            Authentication authentication) {

        UserIdentity identity = getIdentity(authentication);

        if (identity == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElse(null);

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }

        if (!isAdmin(authentication)
                && !sameUserId(identity.id(), booking.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You cannot pay for another user's booking"
                    ));
        }

        if (!"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Only confirmed bookings can be paid"
                    ));
        }

        if ("PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Booking is already paid"));
        }

        String paymentReference =
                "DEMO-" + UUID.randomUUID();

        booking.setPaymentStatus("PAID");
        booking.setPaymentReference(paymentReference);

        Booking updated = bookingRepository.save(booking);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Demo payment successful. No real money was charged.",
                        "bookingId", updated.getId(),
                        "paymentStatus", updated.getPaymentStatus(),
                        "paymentReference", paymentReference
                )
        );
    }

    // 5. Generate a QR code for a booking
    @GetMapping("/{bookingId}/qr")
    @Transactional
    public ResponseEntity<?> getBookingQrCode(
            @PathVariable Long bookingId,
            Authentication authentication) {

        UserIdentity identity = getIdentity(authentication);

        if (identity == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElse(null);

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }

        if (!isAdmin(authentication)
                && !sameUserId(identity.id(), booking.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You cannot access another user's ticket"
                    ));
        }

        if (booking.getTicketReference() == null
                || booking.getTicketReference().isBlank()) {
            booking.setTicketReference(UUID.randomUUID().toString());
            bookingRepository.save(booking);
        }

        try {
            String qrCode = qrCodeService.generateQrCodeBase64(
                    booking.getTicketReference()
            );

            return ResponseEntity.ok(
                    Map.of(
                            "bookingId", booking.getId(),
                            "ticketReference", booking.getTicketReference(),
                            "qrCodeBase64", qrCode,
                            "mimeType", "image/png",
                            "bookingStatus", booking.getBookingStatus(),
                            "paymentStatus",
                            booking.getPaymentStatus() == null
                                    ? "UNPAID"
                                    : booking.getPaymentStatus()
                    )
            );

        } catch (WriterException | IOException exception) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Unable to generate the ticket QR code"
                    ));
        }
    }

    // 6. Verify a ticket (admin only)
    @PostMapping("/verify-ticket")
    public ResponseEntity<?> verifyTicket(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "valid", false,
                            "message", "Only admins can verify tickets"
                    ));
        }

        String ticketReference = request.get("ticketReference");

        if (ticketReference == null || ticketReference.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "valid", false,
                            "message", "Ticket reference is required"
                    ));
        }

        ticketReference = ticketReference.trim();

        String prefix = "VIBEPASS:TICKET:";

        if (ticketReference.startsWith(prefix)) {
            ticketReference = ticketReference.substring(prefix.length());
        }

        Booking booking = bookingRepository
                .findByTicketReference(ticketReference)
                .orElse(null);

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "valid", false,
                            "message", "Ticket not found"
                    ));
        }

        boolean confirmed = "CONFIRMED".equalsIgnoreCase(
                booking.getBookingStatus()
        );

        return ResponseEntity.ok(
                Map.of(
                        "valid", confirmed,
                        "message", confirmed
                                ? "Ticket is valid"
                                : "Ticket is cancelled or not confirmed",
                        "bookingId", booking.getId(),
                        "ticketReference", booking.getTicketReference(),
                        "eventName", booking.getEventName() == null
                                ? "Not available" : booking.getEventName(),
                        "eventDate", booking.getEventDate() == null
                                ? "Not available"
                                : booking.getEventDate().toString(),
                        "bookingStatus", booking.getBookingStatus() == null
                                ? "UNKNOWN" : booking.getBookingStatus()
                )
        );
    }

    // 7. Cancel a booking
    @PutMapping("/{bookingId}/cancel")
    @Transactional
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            Authentication authentication) {

        UserIdentity identity = getIdentity(authentication);

        if (identity == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in first"));
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElse(null);

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }

        if (!isAdmin(authentication)
                && (booking.getUserId() == null
                || !sameUserId(identity.id(), booking.getUserId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "You cannot cancel another user's booking"
                    ));
        }

        if ("CANCELLED".equalsIgnoreCase(booking.getBookingStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Booking is already cancelled"));
        }

        Event event = eventRepository.findById(booking.getEventId())
                .orElse(null);

        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Event not found"));
        }

        int available = event.getAvailableTickets() == null
                ? 0 : event.getAvailableTickets();

        event.setAvailableTickets(available + 1);
        eventRepository.save(event);

        booking.setBookingStatus("CANCELLED");
        Booking updated = bookingRepository.save(booking);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Booking cancelled successfully",
                        "bookingId", updated.getId(),
                        "status", updated.getBookingStatus(),
                        "availableTickets", event.getAvailableTickets()
                )
        );
    }
}
