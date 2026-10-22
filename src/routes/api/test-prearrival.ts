import {
  createFileRoute,
} from "@tanstack/react-router";

export const Route =
  createFileRoute(
    "/api/test-prearrival"
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
            sendPreArrivalEmail,
          } = await import(
            "@/lib/prearrival-email.server"
          );

          await sendPreArrivalEmail({
            id:
              `preview-${Date.now()}`,

            code:
              "MM-TEST01",

            check_in:
              "2026-10-24",

            check_out:
              "2026-10-27",

            guests:
              2,

            name:
              "Γιώργος",

            email:
              "info@mmhome.gr",
          });

          return new Response(
            "Pre-arrival preview email sent",
            {
              status: 200,
            }
          );
        },
      },
    },
  });
