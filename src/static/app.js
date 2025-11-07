document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Render participant badges (or a friendly message when none).
        // Each badge gets a small remove button to unregister the participant.
        const participantsHtml = details.participants && details.participants.length
          ? details.participants.map(p => `
              <span class="participant-badge">
                <span class="participant-email">${p}</span>
                <button class="participant-remove" data-email="${p}" title="Remove ${p}" aria-label="Remove ${p}">×</button>
              </span>
            `).join("")
          : '<span class="no-participants">No participants yet</span>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            <div class="participant-badges">${participantsHtml}</div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach remove handlers for participant remove buttons in this card
        const removeButtons = activityCard.querySelectorAll('.participant-remove');
        removeButtons.forEach(btn => {
          const email = btn.getAttribute('data-email');
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm(`Remove ${email} from ${name}?`)) return;
            try {
              // Add removing class to trigger fade-out animation
              const badge = btn.closest('.participant-badge');
              badge.classList.add('removing');
              // Wait for animation
              await new Promise(resolve => setTimeout(resolve, 300));
              
              const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE', cache: 'no-store' });
              const data = await res.json();
              if (res.ok) {
                // Refresh activities to reflect removal and wait for it to complete
                await fetchActivities();
                messageDiv.textContent = data.message;
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              } else {
                messageDiv.textContent = data.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          cache: "no-store"
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh activities to show updated participants and availability and wait for it to complete
        await fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
