import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import type { Route } from './+types/root'
// import stylesheet from './global.css?url'
import { useSession, signOut } from './lib/auth-client'


export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preconnect',
    href: 'https://challenges.cloudflare.com',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Fleur+De+Leah&display=swap',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Luxurious+Script&display=swap',
  },
    {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Monoton&display=swap',
  },
   {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Sacramento&display=swap',
  },
  // { rel: 'stylesheet', href: stylesheet },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
         <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
 
      </head>

      <body>
        {children}
        <ScrollRestoration />
        
        <Scripts />
        <script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
  async
  defer
/>
          <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" defer />
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" defer />

      </body>
    </html>
  )
}

export default function App() {
  const { data: session, isPending } = useSession()

  return (
    <>
    
<nav
  className="navbar navbar-expand-lg fixed-top border-bottom"
  style={{
    zIndex: 1040,
    top: 0,
    backgroundColor: '#cb2182',

    boxShadow: '0 4px 14px rgba(203, 33, 130, 0.35)',
  }}
>
  <div className="container-fluid px-3 px-lg-4">
    {/* Brand */}
    <a
      className="navbar-brand fw-bold text-white me-3"
      href="/"
      style={{
         fontFamily: '"Monoton", regular',
          fontSize: '1.8rem',
  letterSpacing: '0.03em',
  textShadow: '0 3px 8px rgba(0,0,0,0.35)',
      }}
    >
      Vendulette
    </a>
<span className=" fw-light text-white me-3"  
style={{
         fontFamily: '"Sacramento", regular',
          fontSize: '1.2rem',
  letterSpacing: '0.03em',
  textShadow: '0 3px 8px rgba(0,0,0,0.35)',
      }}>for the Vendula London obsessed</span>
    {/* Toggler */}
    <button
      className="navbar-toggler border-0"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarSupportedContent"
      aria-controls="navbarSupportedContent"
      aria-expanded={false}
      aria-label="Toggle navigation"
      style={{
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: '999px',
      }}
    >
      <span className="navbar-toggler-icon" />
    </button>

    {/* Nav content */}
    <div className="collapse navbar-collapse" id="navbarSupportedContent">
      <ul className="navbar-nav me-auto mb-2 mb-lg-0">
        <li className="nav-item">
          <a
            className="nav-link active text-white fw-semibold px-3"
            aria-current="page"
            href="#"
            style={{
              borderRadius: '999px',
              transition: 'background-color 0.2s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Vendula Handbag Library
          </a>
        </li>

             

        <li className="nav-item dropdown">
          <a
            className="nav-link dropdown-toggle text-white fw-semibold px-3"
            href="#"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded={false}
            style={{
              borderRadius: '999px',
              transition: 'background-color 0.2s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Resources
          </a>
          <ul
            className="dropdown-menu border-0 shadow"
            style={{
              borderRadius: '0px',
              backgroundColor: '#fff',
            }}
          >
            <li>
              <a
                className="dropdown-item py-2"
                href="#"
                style={{ color: '#cb2182' }}
              >
                Where to Buy – Stockists
              </a>
            </li>
            <li>
              <a
                className="dropdown-item py-2"
                href="#"
                style={{ color: '#cb2182' }}
              >
                Shapes to Compare
              </a>
            </li>
            <li className="dropdown-divider" />
            <li>
              <a
                className="dropdown-item py-2"
                href="#"
                style={{ color: '#cb2182' }}
              >
                Contact
              </a>
            </li>
          </ul>
        </li> 
          <li className="nav-item">
          <a
            className="nav-link text-white fw-semibold px-3"
            aria-current="page"
            href="#"
            style={{
              borderRadius: '999px',
              transition: 'background-color 0.2s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Contact
          </a>
        </li>
      </ul>
 {/* <div className="nav nav-tabs" id="nav-tab" role="tablist">
    <button className="nav-link active" id="nav-home-tab" data-bs-toggle="tab" data-bs-target="/home" type="button" role="tab" aria-controls="nav-home" aria-selected="true">
            Vendula Handbag Library</button>
    <button className="nav-link" id="nav-profile-tab" data-bs-toggle="tab" data-bs-target="#nav-profile" type="button" role="tab" aria-controls="nav-profile" aria-selected="false">Profile</button>
    <button className="nav-link" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-contact" type="button" role="tab" aria-controls="nav-contact" aria-selected="false">Contact</button>

  </div> */}
      {/* Search */}
      {/* <form className="d-flex gap-2" role="search">
        <input
          className="form-control"
          type="search"
          placeholder="Search bags, shapes, seasons…"
          aria-label="Search"
          style={{
            borderRadius: '999px',
          
            backgroundColor: 'rgba(255,255,255,0.9)',
            color: '#cb2182',
            fontWeight: 500,
          }}
        />
        <button
          className="btn"
          type="submit"
          style={{
            borderRadius: '999px',
            backgroundColor: '#fff',
            color: '#cb2182',
           
            fontWeight: 700,
            transition: 'transform 0.15s ease, background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffe6f5'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Search
        </button>
      </form> */}
    </div>
  </div>
</nav>
      {/* <header className="d-flex justify-content-end px-4 py-8 ">
       
   
        {isPending ? null : session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">{session.user.email}</span>
            <button
              onClick={() => signOut()}
              className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
            >
              Sign Out 
            </button>
          </div>
        ) : (
          <Link
            to="/sign-in"
            className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
          >
            Sign In
          </Link>
        )}
    
           <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom fixed-top shadow-sm bg-danger-subtle">
  <div className="nav nav-tabs" id="nav-tab" role="tablist">
    <button className="nav-link active" id="nav-home-tab" data-bs-toggle="tab" data-bs-target="#nav-home" type="button" role="tab" aria-controls="nav-home" aria-selected="true">Home</button>
    <button className="nav-link" id="nav-profile-tab" data-bs-toggle="tab" data-bs-target="#nav-profile" type="button" role="tab" aria-controls="nav-profile" aria-selected="false">Profile</button>
    <button className="nav-link" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-contact" type="button" role="tab" aria-controls="nav-contact" aria-selected="false">Contact</button>
    <button className="nav-link" id="nav-disabled-tab" data-bs-toggle="tab" data-bs-target="#nav-disabled" type="button" role="tab" aria-controls="nav-disabled" aria-selected="false" disabled>Disabled</button>
  </div>
</nav>


       </header> */}
      <main>
        <Outlet />
      </main>
      
    </>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}