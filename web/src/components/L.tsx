import NextLink from "next/link";
import type { ComponentProps } from "react";
import { h } from "@/lib/lang-server";

/** Link for server components: internal addresses get the /en prefix on English pages. */
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  return <NextLink href={typeof href === "string" ? h(href) : href} {...rest} />;
}
