
package com.vibepass.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String venue;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    private String emoji;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "available_tickets", nullable = false)
    private Integer availableTickets = 100;

    public Event() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCity() {
        return city;
    }

    public String getCategory() {
        return category;
    }

    public String getVenue() {
        return venue;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getEmoji() {
        return emoji;
    }

    public String getDescription() {
        return description;
    }

    public Integer getAvailableTickets() {
        return availableTickets;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setEmoji(String emoji) {
        this.emoji = emoji;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setAvailableTickets(Integer availableTickets) {
        this.availableTickets = availableTickets;
    }
}
