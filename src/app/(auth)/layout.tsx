/**
 * Auth layout — forces light mode for all auth routes (login, etc.)
 *
 * The ThemeProvider in the root layout respects the user's dark/light preference,
 * which means logging out while in dark mode leaves the login screen dark.
 * Login is a branding surface — it should always be light regardless of theme.
 *
 * Strategy: wrap the auth subtree in a div with class="light" which overrides
 * Tailwind's dark: selector scope. The root <html> may still have class="dark"
 * but all dark: variants inside this wrapper resolve against "light" context.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="light" data-theme="light">
      {children}
    </div>
  );
}
