import {
  createFileRoute,
} from "@tanstack/react-router";

export const Route =
  createFileRoute(
    "/api/test-poststay"
  )({
    server: {
      handlers: {
        GET:
          async () => {
            const {
              requireAdminSession,
            } =
              await import(
                "@/lib/admin-auth.server"
              );

            await requireAdminSession();

            const {
              sendPostStayEmail,
            } =
              await import(
                "@/lib/poststay-email.server"
              );

            await sendPostStayEmail({
              id:
                `poststay-preview-${Date.now()}`,

              code:
                "MM-TEST01",

              check_in:
                "2026-10-20",

              check_out:
                "2026-10-22",

              guests:
                2,

              name:
                "Γιώργος",

              email:
                "info@mmhome.gr",
            });

            return new Response(
              "Post-stay preview email sent",
              {
                status:
                  200,
              }
            );
          },
      },
    },
  });
