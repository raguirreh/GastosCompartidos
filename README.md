# Gastos Compartidos

App móvil de gestión de **gastos compartidos** para grupos, construida con un
enfoque **offline-first** y diseño **Material Design 3 (Material You)**. Permite
crear grupos, registrar gastos, dividirlos de varias formas y saldar cuentas en
tiempo real — sin registro por email y sin publicidad.

## Stack técnico

- **Framework:** React Native + [Expo](https://expo.dev) (SDK 56)
- **Lenguaje:** TypeScript (modo estricto)
- **UI:** [React Native Paper](https://callstack.github.io/react-native-paper/) v5 (Material Design 3)
- **Navegación:** React Navigation v7 (Stack nativo + Bottom Tabs)
- **Animaciones / gestos:** React Native Reanimated 4 + Gesture Handler
- **Estado global:** Zustand
- **Base de datos local:** Expo SQLite (fuente única de verdad, offline-first)
- **Backend / sync:** Firebase (Firestore + Auth anónima)
- **Iconos:** `@expo/vector-icons` (MaterialCommunityIcons)

## Arquitectura offline-first

1. Todo se guarda primero en **SQLite local** (`src/services/database`).
2. Un servicio de **outbox** (`src/services/sync`) encola los cambios pendientes.
3. Cuando hay conexión, el outbox se drena y sincroniza contra **Firestore**.
4. Conflictos resueltos con política *last-write-wins* por timestamp.
5. La UI muestra un indicador sutil de estado **online / offline**.

> **Nota sobre cifrado:** el scaffold usa `expo-sqlite` plano. El punto de
> integración para SQLCipher (clave derivada del UID y guardada en
> `expo-secure-store`) está documentado en `src/services/database/schema.ts` y
> `client.ts`.

## Estructura del proyecto

```
src/
├── app/                # Navegación y tema (Material 3 light/dark)
│   ├── navigation/
│   └── theme/
├── features/           # Pantallas por dominio
│   ├── auth/           # Splash, Onboarding, Perfil inicial
│   ├── groups/         # Home, lista, crear y detalle de grupos
│   ├── expenses/       # Agregar gasto (división equal/%/exacto/partes)
│   ├── balances/       # Saldos consolidados y pagos
│   └── profile/        # Perfil y ajustes
├── shared/             # Componentes, hooks, utils, tipos, mock data
├── services/           # SQLite, Firebase, sync/outbox
└── store/              # Stores Zustand
```

## Instalación paso a paso

### 1. Requisitos

- Node.js 18+ y npm
- App **Expo Go** en tu teléfono (iOS/Android), o un emulador

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase (opcional para correr en local)

La app funciona 100% offline sin Firebase. Para habilitar la sincronización:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com).
2. Activa **Authentication → Anonymous** y **Firestore Database**.
3. Copia el archivo de ejemplo y rellena tus credenciales:

   ```bash
   cp .env.example .env
   ```

   Edita `.env` con los valores de tu proyecto (apiKey, projectId, etc.).
   Estas variables las consume `src/services/firebase/firebaseConfig.ts`.

4. Despliega las reglas de seguridad incluidas en `firestore.rules`.

### 4. Correr la app

```bash
npm start
```

Escanea el QR con Expo Go, o pulsa `a` (Android) / `i` (iOS) para abrir en un
emulador.

## Verificación de tipos

```bash
npx tsc --noEmit
```

## Algoritmo de simplificación de deudas

Implementado en `src/shared/utils/debtSimplification.ts` (*Greedy Debt
Simplification*): calcula el balance neto de cada miembro, separa acreedores y
deudores, y empareja iterativamente al mayor deudor con el mayor acreedor para
minimizar el número de transacciones necesarias para saldar el grupo. Las
funciones son puras y testeables.

## Seguridad

- Autenticación **anónima** de Firebase (sin email ni contraseña).
- **Firebase Security Rules** estrictas: solo miembros del grupo leen/escriben
  sus datos (`firestore.rules`).
- Tokens de invitación únicos con UUID (`src/shared/utils/invite.ts`).
- Punto de integración para **SQLCipher** documentado en la capa de datos.

## Estado actual

Scaffold funcional y navegable. Las pantallas usan datos de ejemplo
(`src/shared/utils/mockData.ts`) donde la persistencia/sincronización real aún
no está conectada de extremo a extremo; la lógica de dominio (cálculo de
saldos, simplificación de deudas, invitaciones, esquema SQLite, outbox) está
implementada.
