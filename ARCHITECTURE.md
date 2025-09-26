# Arquitectura del Proyecto

Este documento describe la arquitectura general del proyecto, basándose en la estructura de archivos actual.

## Esquema de Directorios

```
RAIZ_DEL_PROYECTO/
├── .env.example
├── .gitignore
├── components.json
├── index.html
├── jsconfig.json
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── vite.config.js
├── api/
│   ├── create-payment-intent.js // Endpoint comentado (anteriormente usado para un enfoque diferente)
│   ├── ocr.js
│   ├── openai/
│   │   ├── analyzeCv.js
│   │   ├── compareCv.js
│   │   └── generate-job.js
│   ├── paddle/ // Código de Paddle (comentado o inactivo)
│   │   ├── generate-pay-link.js
│   │   └── webhooks.js
│   └── stripe/ // Endpoints para la integración de Stripe
│       ├── create-payment-intent.js // Crea un PaymentIntent para Stripe Elements
│       └── webhooks.js // Maneja eventos de webhook de Stripe
├── public/
│   └── .htaccess
└── src/
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── components/
    │   ├── AuthCallback.jsx
    │   ├── CandidateSelection.jsx
    │   ├── CreateJob.jsx
    │   ├── CreateJobAIForm.jsx
    │   ├── CreateJobForm.jsx
    │   ├── CVAnalysis.jsx
    │   ├── EditableCV.jsx
    │   ├── FileUploadZone.jsx
    │   ├── Footer.jsx
    │   ├── PaddleButton.jsx
    │   ├── ProcessedCVs.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── PublicRoute.jsx
    │   ├── PublishedJobs.jsx
    │   ├── UploadCV.jsx
    │   ├── dashboard/
    │   │   ├── AIAnalysisTab.jsx
    │   │   ├── CreateNewJobTab.jsx
    │   │   ├── CurrentPlanTab.jsx
    │   │   ├── ProcessedCVsTab.jsx
    │   │   └── UploadCVTab.jsx
    │   ├── landing/
    │   │   ├── BenefitsSection.jsx
    │   │   ├── CtaSection.jsx
    │   │   ├── FaqSection.jsx
    │   │   ├── FeaturesSection.jsx
    │   │   ├── HeroSection.jsx
    │   │   ├── LandingFooter.jsx
    │   │   ├── LandingHeader.jsx
    │   │   ├── PricingSection.jsx
    │   │   └── TestimonialsSection.jsx
    │   └── ui/
    │       ├── accordion.jsx
    │       ├── avatar.jsx
    │       ├── button.jsx
    │       ├── input.jsx
    │       ├── separator.jsx
    │       ├── textarea.jsx
    │       ├── toast.jsx
    │       ├── toaster.jsx
    │       └── use-toast.js
    ├── config/
    │   └── plans.js
    ├── contexts/
    │   └── AuthContext.jsx
    ├── hooks/
    │   ├── useAuthService.js
    │   ├── useCvUploader.js
    │   ├── useDashboardData.js
    │   ├── usePaddle.js
    │   └── usePayment.js
    ├── lib/
    │   ├── auth.js
    │   ├── authUtils.js
    │   ├── cvComparisonAPI.js
    │   ├── fileProcessing.js
    │   ├── jobGeneration.js
    │   ├── openai.js
    │   ├── paddleUtils.js
    │   ├── supabase.js
    │   └── utils.js
    ├── pages/
    │   ├── CompleteProfile.jsx
    │   ├── Dashboard.jsx
    │   ├── Landing.jsx
    │   ├── LegalPage.jsx
    │   ├── Login.jsx
    │   ├── PaymentCancelled.jsx
    │   ├── PaymentSuccess.jsx
    │   ├── PrivacyPage.jsx
    │   ├── Register.jsx
    │   ├── RegisterConfirmation.jsx
    │   ├── ResetPassword.jsx
    │   ├── SupabaseTestPage.jsx
    │   ├── TermsPage.jsx
    │   └── api/
    │       ├── openai/
    │       │   ├── analyzeCv.js
    │       │   └── compareCv.js
    │       └── Landing/
    │           ├── CTA.jsx
    │           ├── Features.jsx
    │           ├── Header.jsx
    │           ├── Hero.jsx
    │           ├── HowItWorks.jsx
    │           ├── index.jsx
    │           ├── Pricing.jsx
    │           ├── Testimonials.jsx
    │           └── TrustedBy.jsx
    ├── services/
    │   ├── cvService.js
    │   ├── generateJobsService.js
    │   └── matchingService.js
```
## 1. Frontend (Aplicación React)

Ubicado principalmente en el directorio `src/`, esta es la interfaz de usuario construida con React.

-   `src/components/`: Contiene componentes React reutilizables, desde elementos pequeños de UI hasta componentes más complejos.
    -   `src/components/ui/`: Componentes de interfaz de usuario genéricos, probablemente de una librería como Shadcn/UI.
    -   `src/components/dashboard/`: Componentes específicos para la vista del dashboard.
    -   `src/components/landing/`: Componentes específicos para la página de aterrizaje. Incluye `PricingSection.jsx` modificado para redirigir al checkout de Stripe.
    -   `src/components/StripeButton.jsx`: Componente de botón para iniciar el checkout de Stripe (usado en la implementación inicial de Checkout Sessions, ahora comentado/inactivo).
    -   `src/components/StripePaymentForm.jsx`: Componente que renderiza el formulario de pago de Stripe Elements.
-   `src/pages/`: Componentes de nivel superior que representan las diferentes páginas o rutas de la aplicación. Incluye `CheckoutPage.jsx` para el formulario de pago integrado con Stripe Elements.
-   `src/hooks/`: Hooks personalizados de React para encapsular lógica reutilizable. Incluye `useStripePayment.js` (para Checkout Sessions, ahora comentado/inactivo) y `usePaddle.js` (comentado/inactivo).
-   `src/contexts/`: Contextos de React para la gestión del estado global (ej. `src/contexts/AuthContext.jsx`). El contexto de autenticación ahora incluye la información de suscripción del usuario obtenida de Supabase.
-   `src/lib/`: Contiene código de utilidad, clientes para APIs externas (Supabase, OpenAI, Stripe), lógica de autenticación, procesamiento de archivos, etc. `auth.js` se modificó para obtener datos de suscripción.
-   `src/services/`: Módulos que encapsulan la lógica de negocio relacionada con características específicas (ej. servicios para CVs, generación de trabajos, matching).
-   `src/index.css`, `tailwind.config.js`, `postcss.config.js`: Archivos relacionados con el estilo y la configuración de Tailwind CSS.
-   `src/main.jsx`: Punto de entrada de la aplicación. La inicialización de Paddle.js está comentada.
-   `src/App.jsx`: Configuración de rutas y envoltura con el `Elements` provider de `@stripe/react-stripe-js`.

## 2. Backend / API

Ubicado en el directorio `api/`, contiene las funciones o rutas de API que interactúan con servicios externos o realizan tareas del lado del servidor.

-   `api/create-payment-intent.js`: Endpoint comentado, anteriormente usado para un enfoque diferente de creación de Payment Intent.
-   `api/ocr.js`: Probablemente maneja el reconocimiento óptico de caracteres.
-   `api/openai/`: Rutas para interactuar con la API de OpenAI (análisis, comparación de CVs, generación de trabajos).
-   `api/paddle/`: Rutas relacionadas con la integración de Paddle (generación de enlaces de pago, webhooks). Este código está comentado o inactivo.
-   `api/stripe/`: Rutas para la integración de Stripe.
    -   `api/stripe/create-payment-intent.js`: Crea un PaymentIntent en Stripe para ser usado con Stripe Elements en el frontend.
    -   `api/stripe/webhooks.js`: Maneja los eventos de webhook enviados por Stripe para actualizar la base de datos de Supabase.

## 3. Configuración

Archivos que configuran el proyecto y su entorno.

-   `.env.example`: Ejemplo de variables de entorno necesarias, incluyendo las de Stripe y Supabase.
-   `package.json`, `package-lock.json`: Define las dependencias del proyecto, incluyendo `stripe` y `@stripe/react-stripe-js`.
-   `jsconfig.json`: Configuración para JavaScript en el editor.
-   `vite.config.js`: Configuración del bundler Vite, ajustada para el despliegue en Vercel.
-   `vercel.json`: Configuración para el despliegue en Vercel.
-   `components.json`: Configuración para componentes (posiblemente Shadcn/UI).
-   `src/config/plans.js`: Define los planes de la aplicación y su mapeo con los IDs de Producto y Precio de Stripe.

## 4. Otros

Archivos y directorios adicionales.

-   `public/`: Contiene archivos estáticos que se sirven directamente.
-   `.gitignore`: Especifica archivos y directorios que Git debe ignorar.