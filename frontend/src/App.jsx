
import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const [myRegistrations, setMyRegistrations] = useState([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationsError, setRegistrationsError] = useState("");

 const [adminForm, setAdminForm] = useState({
  title: "",
  description: "",
  category: "",
  eventDate: "",
  eventTime: "",
  venue: "",
});

  const [editingEventId, setEditingEventId] = useState(null);

  // Admin: registrations for the selected event
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [eventRegistrationsLoading, setEventRegistrationsLoading] = useState(false);
  const [eventRegistrationsError, setEventRegistrationsError] = useState("");

  // Load events
  async function fetchEvents() {
    try {
      setEventsLoading(true);
      setEventsError("");

      const response = await fetch(
        "http://localhost:8081/api/events"
      );

      if (!response.ok) {
        throw new Error("Could not load events.");
      }

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      setEventsError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that it is running."
          : error.message
      );
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  // Student registration form
  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // Login form
  function handleLoginChange(e) {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
  }

  // Admin event form
  function handleAdminFormChange(e) {
    setAdminForm({
      ...adminForm,
      [e.target.name]: e.target.value,
    });
  }

  // Page navigation
  function changePage(nextPage) {
    setPage(nextPage);
    setMessage("");
  }

  // Register a new student account
  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8081/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          }),
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            data.error ||
            `Registration failed. Status: ${response.status}`
        );
      }

      setLoginForm({
        email: form.email.trim(),
        password: "",
      });

      setForm({
        name: "",
        email: "",
        password: "",
      });

      setPage("login");
      setMessage("Registration successful! Please log in.");
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that it is running."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // Student login
  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8081/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginForm),
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setCurrentUser({
        name: data.name,
        email: data.email,
        role: data.role,
      });

      setLoginForm({
        email: "",
        password: "",
      });

      setPage("home");
      setMessage(`Welcome, ${data.name}! Login successful.`);
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that it is running."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // Register for an event
  async function handleEventRegistration(eventId) {
    if (!currentUser) {
      setMessage("Please log in before registering for an event.");
      setPage("login");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8081/api/event-registrations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: String(eventId),
            studentEmail: currentUser.email,
          }),
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            data.error ||
            `Event registration failed. Status: ${response.status}`
        );
      }

      setMessage(
        data.message || "Successfully registered for the event!"
      );

      if (page === "registrations") {
        await fetchMyRegistrations();
      }
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that it is running."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch registrations for the logged-in student
  async function fetchMyRegistrations() {
    if (!currentUser) {
      setPage("login");
      setMessage("Please log in to view your registrations.");
      return;
    }

    setPage("registrations");
    setMessage("");
    setRegistrationsLoading(true);
    setRegistrationsError("");

    try {
      const response = await fetch(
        `http://localhost:8081/api/event-registrations?email=${encodeURIComponent(
          currentUser.email
        )}`
      );

      const responseText = await response.text();
      let data = [];

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            data.error ||
            "Could not load your registrations."
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected registrations response.");
      }

      setMyRegistrations(data);
    } catch (error) {
      setRegistrationsError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that it is running."
          : error.message
      );
    } finally {
      setRegistrationsLoading(false);
    }
  }

  // Admin: add or update an event
   async function saveEvent(e){
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const url = editingEventId
        ? `http://localhost:8081/api/events/${editingEventId}`
        : "http://localhost:8081/api/events";
      console.log("Event data being sent:", adminForm);
      const response = await fetch(url, {
        method: editingEventId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminForm),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            data.error ||
            "Could not save the event."
        );
      }

      setAdminForm({
  title: "",
  description: "",
  category: "",
  eventDate: "",
  eventTime: "",
  venue: "",
});

      setEditingEventId(null);
      setMessage(
        editingEventId
          ? "Event updated successfully!"
          : "Event added successfully!"
      );

      await fetchEvents();
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // Admin: select an event for editing
  function startEditingEvent(event) {
    setEditingEventId(event.id);
setAdminForm({
  title: event.title,
  description: event.description,
  category: event.category || "",
  eventDate: event.eventDate,
  eventTime: event.eventTime,
  venue: event.venue,
});

    setMessage("");
    window.scrollTo(0, 0);
  }

  // Admin: delete an event
  async function deleteEvent(eventId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8081/api/events/${eventId}`,
        {
          method: "DELETE",
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText || "Could not delete the event."
        );
      }

      setMessage("Event deleted successfully!");
      await fetchEvents();
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // Admin: view students registered for a particular event
  async function fetchEventRegistrations(eventId) {
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
      setEventRegistrations([]);
      setEventRegistrationsError("");
      return;
    }

    setSelectedEventId(eventId);
    setEventRegistrations([]);
    setEventRegistrationsError("");
    setEventRegistrationsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8081/api/event-registrations/event/${eventId}`
      );

      const responseText = await response.text();
      let data = [];

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            data.error ||
            "Could not load registered students."
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected registrations response.");
      }

      setEventRegistrations(data);
    } catch (error) {
      setEventRegistrationsError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that it is running."
          : error.message
      );
    } finally {
      setEventRegistrationsLoading(false);
    }
  }

  // Reset and log out
  function handleLogout() {
    setCurrentUser(null);
    setMyRegistrations([]);
    setPage("home");
    setMessage("You have logged out.");
  }

  return (
    <div className="app">
      <header className="navbar">
        <h2>CampusConnect</h2>

        <div>
          <button onClick={() => changePage("home")}>
            Home
          </button>

          <button onClick={() => changePage("register")}>
            Register
          </button>

          <button onClick={() => changePage("login")}>
            Login
          </button>

          {currentUser && (
            <button onClick={fetchMyRegistrations}>
              My Registrations
            </button>
          )}

          {currentUser?.role === "ADMIN" && (
            <button onClick={() => changePage("admin")}>
              Admin Dashboard
            </button>
          )}
        </div>
      </header>

      {/* HOME PAGE */}
      {page === "home" ? (
        <main className="hero">
          <p className="tagline">
            YOUR CAMPUS, YOUR COMMUNITY
          </p>

          <h1>Discover. Participate. Celebrate.</h1>

          <p>
            Find college events, explore your interests and
            never miss an opportunity to participate.
          </p>

          {currentUser ? (
            <p>
              Welcome, <strong>{currentUser.name}</strong>!
            </p>
          ) : (
            <button
              className="primary"
              onClick={() => changePage("register")}
            >
              Create Student Account
            </button>
          )}

          <section className="events-section">
            <h2>Upcoming Campus Events</h2>

<input
  type="text"
  placeholder="🔍 Search events by name or venue..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="event-search"
/>

            {eventsLoading && <p>Loading events...</p>}
            {eventsError && <p>{eventsError}</p>}

            {!eventsLoading &&
              !eventsError &&
              events.length === 0 && (
                <p>No events available yet.</p>
              )}
            {!eventsLoading &&
  !eventsError &&
  events.length > 0 &&
  events.filter((event) =>
    `${event.title || ""} ${event.venue || ""}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  ).length === 0 && (
    <p>No events match your search. Try another name or venue.</p>
  )}
            <div className="events-grid">
{events
  .filter((event) =>
    `${event.title} ${event.venue}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
  .map((event) => (
                <article className="event-card" key={event.id}>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>

                  <p>
                    <strong>Date:</strong> {event.eventDate}
                  </p>

                  <p>
                    <strong>Time:</strong> {event.eventTime}
                  </p>

                  <p>
                    <strong>Venue:</strong> {event.venue}
                  </p>

                  <button
                    className="primary"
                    disabled={loading}
                    onClick={() =>
                      handleEventRegistration(event.id)
                    }
                  >
                    {loading
                      ? "Please wait..."
                      : "Register for Event"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          {message && (
            <p className="message" role="status">
              {message}
            </p>
          )}

          {!currentUser && (
            <p>
              Already registered?{" "}
              <button onClick={() => changePage("login")}>
                Log in here
              </button>
            </p>
          )}

          {currentUser && (
            <button onClick={handleLogout}>
              Logout
            </button>
          )}
        </main>
      ) : page === "register" ? (
        /* STUDENT REGISTRATION PAGE */
        <main className="register-card">
          <h1>Student Registration</h1>
          <p>Create an account to explore campus events.</p>

          <form onSubmit={handleRegister}>
            <label>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />

            <label>College Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              minLength={8}
              required
            />

            <button
              className="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          {message && (
            <p className="message" role="status">
              {message}
            </p>
          )}

          <p className="back-link">
            Already have an account?{" "}
            <button onClick={() => changePage("login")}>
              Login
            </button>
          </p>

          <p className="back-link">
            <button onClick={() => changePage("home")}>
              Back to Home
            </button>
          </p>
        </main>
      ) : page === "registrations" ? (
        /* MY REGISTRATIONS PAGE */
        <main className="register-card">
          <h1>My Registrations</h1>
          <p>Events you have registered for.</p>

          {registrationsLoading && (
            <p>Loading your registrations...</p>
          )}

          {registrationsError && (
            <p className="message" role="alert">
              {registrationsError}
            </p>
          )}

          {!registrationsLoading &&
            !registrationsError &&
            myRegistrations.length === 0 && (
              <p>
                You haven't registered for any events yet.
              </p>
            )}

          <div className="events-grid">
            {myRegistrations.map((registration) => (
              <article
                className="event-card"
                key={registration.id}
              >
                <h3>
                  {registration.event?.title ||
                    "Event details unavailable"}
                </h3>

                {registration.event && (
                  <>
                    <p>{registration.event.description}</p>

                    <p>
                      <strong>Date:</strong>{" "}
                      {registration.event.eventDate}
                    </p>

                    <p>
                      <strong>Time:</strong>{" "}
                      {registration.event.eventTime}
                    </p>

                    <p>
                      <strong>Venue:</strong>{" "}
                      {registration.event.venue}
                    </p>
                  </>
                )}

                <p>
                  <strong>Status:</strong> Registered
                </p>
              </article>
            ))}
          </div>

          <button onClick={() => changePage("home")}>
            Back to Home
          </button>

          <button onClick={fetchMyRegistrations}>
            Refresh Registrations
          </button>

          <button onClick={handleLogout}>
            Logout
          </button>
        </main>
      ) : page === "admin" ? (
        /* ADMIN DASHBOARD */
        <main className="register-card">
          {currentUser?.role === "ADMIN" ? (
            <>
              <h1>Admin Dashboard</h1>
              <p>Add, edit, and manage campus events.</p>

              <form onSubmit={saveEvent}>
                <label>Event Title</label>
                <input
                  name="title"
                  value={adminForm.title}
                  onChange={handleAdminFormChange}
                  placeholder="Enter event title"
                  required
                />

                <label>Description</label>
                <textarea
                  name="description"
                  value={adminForm.description}
                  onChange={handleAdminFormChange}
                  placeholder="Describe the event"
                  rows={4}
                  required
                />
                <label>Event Category</label>
<select
  name="category"
  value={adminForm.category}
  onChange={handleAdminFormChange}
  required
>
  <option value="">Select Category</option>
  <option value="Technical">Technical</option>
  <option value="Non-Technical">Non-Technical</option>
</select>
                <label>Date</label>
                <input
                  type="date"
                  name="eventDate"
                  value={adminForm.eventDate}
                  onChange={handleAdminFormChange}
                  required
                />

                <label>Time</label>
                <input
                  type="time"
                  name="eventTime"
                  value={adminForm.eventTime}
                  onChange={handleAdminFormChange}
                  required
                />

                <label>Venue</label>
                <input
                  name="venue"
                  value={adminForm.venue}
                  onChange={handleAdminFormChange}
                  placeholder="Enter venue"
                  required
                />

                <button
                  className="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : editingEventId
                      ? "Update Event"
                      : "Add Event"}
                </button>

                
{editingEventId && (
  <button
    type="button"
    onClick={() => {
      setEditingEventId(null);
      setAdminForm({
        title: "",
        description: "",
        category: "",
        eventDate: "",
        eventTime: "",
        venue: "",
      });
      setMessage("");
    }}
  >
    Cancel Edit
  </button>
)}

              </form>

              
{message && (
  <p className="message" role="status">
    {message}
  </p>
)}
              <h2>Existing Events</h2>

              {eventsLoading && <p>Loading events...</p>}
              {eventsError && <p>{eventsError}</p>}

              {!eventsLoading &&
                !eventsError &&
                events.length === 0 && (
                  <p>No events available.</p>
                )}

              <div className="events-grid">
                {events.map((event) => (
                  <article
                    className="event-card"
                    key={event.id}
                  >
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>

                    <p>
                      <strong>Date:</strong> {event.eventDate}
                    </p>

                    <p>
                      <strong>Time:</strong> {event.eventTime}
                    </p>

                    <p>
                      <strong>Venue:</strong> {event.venue}
                    </p>

                    <button
                      type="button"
                      onClick={() => startEditingEvent(event)}
                    >
                      Edit
                    </button>


                    <button
  type="button"
  onClick={() => fetchEventRegistrations(event.id)}
>
  {selectedEventId === event.id
    ? "Hide Students"
    : "View Students"}
</button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => deleteEvent(event.id)}
                    >
                      Delete
                    </button>

                    {selectedEventId === event.id && (
                      <section className="registrations-list">
                        <h4>Registered Students</h4>

                        {eventRegistrationsLoading && (
                          <p>Loading registered students...</p>
                        )}

                        {eventRegistrationsError && (
                          <p className="message" role="alert">
                            {eventRegistrationsError}
                          </p>
                        )}

                        {!eventRegistrationsLoading &&
                          !eventRegistrationsError &&
                          eventRegistrations.length === 0 && (
                            <p>No students have registered for this event yet.</p>
                          )}

                        {!eventRegistrationsLoading &&
                          !eventRegistrationsError &&
                          eventRegistrations.map((registration) => (
                            <div key={registration.id} className="student-registration">
                              <p>
                                <strong>Email:</strong>{" "}
                                {registration.studentEmail}
                              </p>
                              <p>
                                <strong>Registered at:</strong>{" "}
                                {registration.registeredAt
                                  ? new Date(registration.registeredAt).toLocaleString()
                                  : "Not available"}
                              </p>
                            </div>
                          ))}
                      </section>
                    )}
                  </article>
                ))}
              </div>

              <button onClick={() => changePage("home")}>
                Back to Home
              </button>
            </>
          ) : (
            <>
              <h1>Access Denied</h1>
              <p>Only an admin account can view this page.</p>
              <button onClick={() => changePage("home")}>
                Back to Home
              </button>
            </>
          )}
        </main>
      ) : (
        /* STUDENT LOGIN PAGE */
        <main className="register-card">
          <h1>Student Login</h1>
          <p>Log in to your CampusConnect account.</p>

          <form onSubmit={handleLogin}>
            <label>College Email</label>
            <input
              type="email"
              name="email"
              value={loginForm.email}
              onChange={handleLoginChange}
              placeholder="Enter your registered email"
              required
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              value={loginForm.password}
              onChange={handleLoginChange}
              placeholder="Enter your password"
              required
            />

            <button
              className="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {message && (
            <p className="message" role="status">
              {message}
            </p>
          )}

          <p className="back-link">
            New student?{" "}
            <button onClick={() => changePage("register")}>
              Create an account
            </button>
          </p>

          <p className="back-link">
            <button onClick={() => changePage("home")}>
              Back to Home
            </button>
          </p>
        </main>
      )}

      <footer>
        © 2026 CampusConnect | Campus Event Management System
      </footer>
    </div>
  );
}

export default App;
