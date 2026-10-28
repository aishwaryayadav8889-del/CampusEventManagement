
package backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import backend.entity.EventRegistration;

public interface EventRegistrationRepository
        extends JpaRepository<EventRegistration, Long> {

    boolean existsByEventIdAndStudentEmail(
            Long eventId, String studentEmail);

    List<EventRegistration> findByStudentEmailIgnoreCase(
            String studentEmail);

    // Get all registrations for a particular event
    List<EventRegistration> findByEventId(Long eventId);
}

