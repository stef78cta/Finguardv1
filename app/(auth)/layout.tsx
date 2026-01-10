/**
 * Layout pentru grupul de rute de autentificare (auth).
 * 
 * Acest layout este folosit pentru paginile /sign-in și /sign-up.
 * Grupul (auth) cu paranteze nu apare în URL.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
