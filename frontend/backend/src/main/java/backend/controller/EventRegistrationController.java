
package backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import backend.entity.Event;
import backend.entity.EventRegistration;
import backend.repository.EventRegistrationRepository;
import backend.repository.EventRepository;

@RestController
@RequestMapping("/api/event-registrations")
@CrossOrigin(origins = "http://localhost:5173")
public class EventRegistrationController {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;

    public EventRegistrationController(
            EventRepository eventRepository,
            EventRegistrationRepository registrationRepository) {

        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    // Register a student for an event
    @PostMapping
    public Map<String, String> registerForEvent(
            @RequestBody Map<String, String> request) {

        String email = request.get("studentEmail");
        String eventIdValue = request.get("eventId");

        if (email == null || email.isBlank()
                || eventIdValue == null || eventIdValue.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student email and event ID are required");
        }

        email = email.trim();

        Long eventId;

        try {
            eventId = Long.parseLong(eventIdValue);
        } catch (NumberFormatException ex) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid event ID");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Event not found"));

        if (registrationRepository
                .existsByEventIdAndStudentEmail(eventId, email)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You have already registered for this event");
        }

        EventRegistration registration = new EventRegistration();
        registration.setStudentEmail(email);
        registration.setEvent(event);

        registrationRepository.save(registration);

        return Map.of(
                "message",
                "Successfully registered for the event!");
    }

    // Get all registrations for a student
    @GetMapping
    public List<EventRegistration> getMyRegistrations(
            @RequestParam String email) {

        if (email == null || email.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student email is required");
        }

        return registrationRepository
                .findByStudentEmailIgnoreCase(email.trim());
    }

    // NEW: Get all registrations for a particular event
    @GetMapping("/event/{eventId}")
    public List<EventRegistration> getRegistrationsForEvent(
            @PathVariable Long eventId) {

        if (!eventRepository.existsById(eventId)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Event not found");
        }

        return registrationRepository.findByEventId(eventId);
    }
}
