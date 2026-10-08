import { Link, usePathname } from "expo-router";
import { ScrollView, Text } from "react-native";

const NAV_LINKS = [
  { href: "/index" as const, match: "/", label: "Dashboard" },
  { href: "/accounts/index" as const, match: "/accounts", label: "Cuentas" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-5 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800"
    >
      {NAV_LINKS.map((link) => {
        const isActive =
          pathname === link.match || pathname.startsWith(`${link.match}/`);
        return (
          <Link key={link.href} href={link.href} asChild>
            <Text
              className={
                isActive
                  ? "text-sm font-semibold text-accent"
                  : "text-sm font-medium text-zinc-600 dark:text-zinc-400"
              }
            >
              {link.label}
            </Text>
          </Link>
        );
      })}
    </ScrollView>
  );
}
