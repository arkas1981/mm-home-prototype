import {
  createFileRoute,
} from "@tanstack/react-router";

export const Route =
  createFileRoute(
    "/api/test-email"
  )({
    server: {
      handlers: {
        GET: async () => {
          const {
            requireAdminSession,
          } = await import(
            "@/lib/admin-auth.server"
          );

          await requireAdminSession();

          const {
            sendOwnerBookingEmail,
          } = await import(
            "@/lib/booking-email.server"
          );

          await sendOwnerBookingEmail({
            id:
              `test-${Date.now()}`,
            code:
              "MM-TEST01",
            check_in:
              "2026-12-01",
            check_out:
              "2026-12-04",
            guests: 2,
            name:
              "Δοκιμαστικός Πελάτης",
            email:
              "test@example.com",
            phone:
              "+30 6900000000",
            rate:
              "flexible",
            total: 600,
          });

          return new Response(
            "Test email sent",
            {
              status: 200,
            }
          );
        },
      },
    },
  });
