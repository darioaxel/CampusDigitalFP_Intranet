export function useRole() {
  const session = useUserSession()
  return computed(() => session.user?.role ?? "user")
}