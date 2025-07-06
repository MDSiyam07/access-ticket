import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Désactiver temporairement le middleware pour permettre les redirections
  // Le middleware sera réactivé une fois que le système de cookies sera implémenté
  return NextResponse.next();

  // Code commenté pour référence future
  /*
  // Vérifier si c'est une route protégée
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Si c'est la page de login, laisser passer
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Si c'est une route protégée, vérifier l'authentification
  if (isProtectedRoute) {
    // Vérifier le token d'authentification (simulation)
    // En production, vous devriez vérifier un vrai JWT
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      // Rediriger vers la page de login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Pour les routes admin, vérifier les permissions
    if (isAdminRoute) {
      // En production, vérifier le rôle dans le token JWT
      const userRole = request.cookies.get('user-role')?.value;
      
      if (userRole !== 'admin') {
        // Rediriger vers le dashboard pour les utilisateurs non-admin
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 