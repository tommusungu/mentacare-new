const BASE_URL = "https://email-server-mentacare.onrender.com";

// Send booking confirmation to patient & professional
export const sendBookingConfirmationEmail = async (details) => {
  const res = await fetch(`${BASE_URL}/send-booking-confirmation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(details),
  });

  if (!res.ok) {
    throw new Error("Failed to send confirmation email");
  }

  return res.json();
};

// Send booking completion to patient & professional
export const acceptAppointmentEmail = async (details) => {
  const res = await fetch(`${BASE_URL}/accept-appointment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(details),
  });

  if (!res.ok) {
    throw new Error("Failed to send completion email");
  }

  return res.json();
};


// Send welcome email to user (patient or professional)
export const sendWelcomeEmail = async ({ email, name, userType }) => {
  const res = await fetch(`${BASE_URL}/send-welcome-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, name, userType }),
  });

  if (!res.ok) {
    throw new Error("Failed to send welcome email");
  }

  return res.json();
};

// // Send verification email to approved professional
// export const sendVerificationEmail = async ({ email, name }) => {
//   const res = await fetch(`${BASE_URL}/send-verification-email`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ email, name }),
//   });

//   if (!res.ok) {
//     throw new Error("Failed to send verification email");
//   }

//   return res.json();
// };
