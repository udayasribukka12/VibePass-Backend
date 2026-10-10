
package com.vibepass.backend.repository;

import com.vibepass.backend.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByBookingDateDesc(Long userId);

    Optional<Booking> findByTicketReference(String ticketReference);
}
