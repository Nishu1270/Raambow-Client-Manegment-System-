import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("ramboow_auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isApiRoute = pathname.startsWith("/api");
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/favicon.svg") ||
    pathname.startsWith("/logo") ||
    pathname.includes(".");

  if (isApiRoute || isPublicAsset) {
    return NextResponse.next();
  }

  // If user visits root /
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and visits login page
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If NOT logged in and visits protected route
  const protectedRoutes = [
    "/dashboard",
    "/clients",
    "/follow-ups",
    "/future",
    "/call-history",
    "/team",
    "/reports",
    "/settings",
    "/data-management",
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
