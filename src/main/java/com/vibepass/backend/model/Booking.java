
package com.vibepass.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "event_city")
    private String eventCity;

    @Column(name = "event_venue")
    private String eventVenue;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "ticket_price", nullable = false)
    private BigDecimal ticketPrice;

    @Column(name = "booking_status", nullable = false)
    private String bookingStatus = "CONFIRMED";

    @Column(name = "booking_date", insertable = false, updatable = false)
    private LocalDateTime bookingDate;

    @Column(name = "ticket_reference", unique = true, length = 36)
    private String ticketReference;

    // Demo payment tracking only; not proof of real payment.
    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "UNPAID";

    @Column(name = "payment_reference", unique = true, length = 60)
    private String paymentReference;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Booking() {
    }

    @PrePersist
    @PreUpdate
    protected void prepareBooking() {
        if (ticketReference == null || ticketReference.isBlank()) {
            ticketReference = UUID.randomUUID().toString();
        }

        if (bookingStatus == null || bookingStatus.isBlank()) {
            bookingStatus = "CONFIRMED";
        }

        if (paymentStatus == null || paymentStatus.isBlank()) {
            paymentStatus = "UNPAID";
        }
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public String getEventCity() {
        return eventCity;
    }

    public void setEventCity(String eventCity) {
        this.eventCity = eventCity;
    }

    public String getEventVenue() {
        return eventVenue;
    }

    public void setEventVenue(String eventVenue) {
        this.eventVenue = eventVenue;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public BigDecimal getTicketPrice() {
        return ticketPrice;
    }

    public void setTicketPrice(BigDecimal ticketPrice) {
        this.ticketPrice = ticketPrice;
    }

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }

    public String getTicketReference() {
        return ticketReference;
    }

    public void setTicketReference(String ticketReference) {
        this.ticketReference = ticketReference;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
}
