
package com.vibepass.backend.config;

import com.vibepass.backend.model.Event;
import com.vibepass.backend.repository.EventRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
public class EventDataSeeder {

    @Bean
    CommandLineRunner seedEvents(EventRepository repository) {
        return args -> {
            long existing = repository.count();

            if (existing >= 70) {
                System.out.println("70 or more events already exist.");
                return;
            }

            String[] categories = {
                    "Music", "Technology", "Comedy", "Food",
                    "Sports", "Workshop", "Festival"
            };

            String[] cities = {
                    "Hyderabad", "Warangal", "Bengaluru",
                    "Chennai", "Mumbai", "Vijayawada",
                    "Visakhapatnam", "Delhi", "Pune", "Kolkata"
            };

            String[] venues = {
                    "HITEX Exhibition Center",
                    "T-Hub",
                    "Shilpakala Vedika",
                    "City Convention Center",
                    "Public Garden",
                    "University Auditorium",
                    "Sports Stadium"
            };

            String[] emojis = {
                    "🎵", "💻", "😂", "🍕",
                    "⚽", "🎓", "🎉"
            };

            for (long i = existing; i < 70; i++) {
                int categoryIndex = (int) (i % categories.length);
                int cityIndex = (int) (i % cities.length);
                int venueIndex = (int) (i % venues.length);

                Event event = new Event();

                event.setName(
                        categories[categoryIndex]
                                + " Experience " + (i + 1)
                );

                event.setCity(cities[cityIndex]);
                event.setCategory(categories[categoryIndex]);
                event.setVenue(venues[venueIndex]);

                event.setEventDate(
                        LocalDate.now().plusDays(7 + i)
                );

                event.setPrice(
                        BigDecimal.valueOf(199 + (i % 8) * 100)
                );

                event.setEmoji(emojis[categoryIndex]);

                event.setDescription(
                        "Discover an exciting "
                                + categories[categoryIndex].toLowerCase()
                                + " experience in " + cities[cityIndex]
                                + ". Book your tickets with VibePass!"
                );

                event.setAvailableTickets(100);

                repository.save(event);
            }

            System.out.println(
                    "VibePass sample events are ready. Total events: "
                            + repository.count()
            );
        };
    }
}
