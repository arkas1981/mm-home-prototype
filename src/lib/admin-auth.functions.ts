import { createServerFn } from "@tanstack/react-start";

export const adminSession =
  createServerFn({
    method: "GET",
  }).handler(async () => {
    const {
      isAdminAuthenticated,
    } = await import(
      "./admin-auth.server"
    );

    return {
      authenticated:
        await isAdminAuthenticated(),
    };
  });

export const adminAuthDiagnostic =
  createServerFn({
    method: "GET",
  }).handler(async () => {
    const {
      adminEnvironmentStatus,
    } = await import(
      "./admin-auth.server"
    );

    return adminEnvironmentStatus();
  });

export const adminLogin =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (d: {
        email: string;
        password: string;
      }) => d
    )
    .handler(async ({ data }) => {
      const {
        loginAdmin,
      } = await import(
        "./admin-auth.server"
      );

      const ok = await loginAdmin(
        data.email,
        data.password
      );

      return {
        ok,
      };
    });

export const adminLogout =
  createServerFn({
    method: "POST",
  }).handler(async () => {
    const {
      logoutAdmin,
    } = await import(
      "./admin-auth.server"
    );

    logoutAdmin();

    return {
      ok: true as const,
    };
  });
