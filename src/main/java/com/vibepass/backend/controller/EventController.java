
        package com.vibepass.backend.controller;

import com.vibepass.backend.model.Event;
import com.vibepass.backend.repository.EventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(originPatterns = {
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://vibe-pass-frontend.vercel.app"
})
public class EventController {

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    // Get all events
    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    // Create an event
    @PostMapping
    public ResponseEntity<Event> createEvent(
            @RequestBody Event event) {

        event.setId(null);
        Event savedEvent = eventRepository.save(event);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedEvent);
    }
}
