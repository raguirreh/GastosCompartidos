import { useEffect, useRef, useState } from 'react';
import './AuthScreen.css';

type Step = 'email' | 'login' | 'signup';

const existingUsers = ['rena@test.com', 'user@splitwise.com'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'`~]/.test(password),
  };
}

function getPasswordScore(checks: PasswordChecks): number {
  return Object.values(checks).filter(Boolean).length;
}

function getStrengthColor(score: number): string {
  if (score <= 1) return '#d93025';
  if (score === 2) return '#e8a33d';
  if (score === 3) return '#e8c93d';
  return '#2e9e4f';
}

function Spinner({ dark }: { dark?: boolean }) {
  return <span className={`spinner${dark ? ' spinnerDark' : ''}`} />;
}

export function AuthScreen() {
  const [step, setStep] = useState<Step>('email');
  const [transitioning, setTransitioning] = useState(false);

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (step === 'login') {
      passwordInputRef.current?.focus();
    } else if (step === 'signup') {
      firstNameInputRef.current?.focus();
    } else if (step === 'email') {
      emailInputRef.current?.focus();
    }
  }, [step]);

  const goToStep = (next: Step) => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 180);
  };

  const emailIsValid = isValidEmail(email);
  const emailError = emailTouched && email.length > 0 && !emailIsValid ? 'Ingresa un correo válido' : '';

  const handleContinue = async () => {
    if (!emailIsValid) return;
    setIsCheckingEmail(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsCheckingEmail(false);
    const exists = existingUsers.includes(email.trim().toLowerCase());
    goToStep(exists ? 'login' : 'signup');
  };

  const handleEditEmail = () => {
    setPassword('');
    setLoginError('');
    goToStep('email');
  };

  const handleLogin = async () => {
    if (password.length === 0) {
      setLoginError('Ingresa tu contraseña');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsLoggingIn(false);
    setLoginError('Función de demostración: no hay backend real conectado.');
  };

  const signupChecks = getPasswordChecks(signupPassword);
  const signupScore = getPasswordScore(signupChecks);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === signupPassword;
  const confirmError =
    touched.confirmPassword && confirmPassword.length > 0 && !passwordsMatch ? 'Las contraseñas no coinciden' : '';
  const firstNameError = touched.firstName && firstName.trim().length === 0 ? 'Ingresa tu nombre' : '';
  const lastNameError = touched.lastName && lastName.trim().length === 0 ? 'Ingresa tu apellido' : '';

  const signupFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    signupScore === 4 &&
    passwordsMatch;

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSignUp = async () => {
    if (!signupFormValid) return;
    setIsSigningUp(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsSigningUp(false);
  };

  return (
    <div className="authScreen">
      <div className={`authCard${transitioning ? ' transitioning' : ''}`}>
        <div className="authLogo">💸</div>

        {step === 'email' && (
          <>
            <h1 className="authTitle">Bienvenido a Splitwise</h1>

            <div className="authField">
              <label className="authLabel" htmlFor="email-input">
                Email
              </label>
              <input
                id="email-input"
                ref={emailInputRef}
                className={`authInput${emailError ? ' invalid' : ''}`}
                type="email"
                value={email}
                placeholder="tu@correo.com"
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && emailIsValid) handleContinue();
                }}
              />
              {emailError.length > 0 && <div className="authError">{emailError}</div>}
            </div>

            <button
              type="button"
              className="authButton"
              disabled={!emailIsValid || isCheckingEmail}
              onClick={handleContinue}
            >
              {isCheckingEmail ? <Spinner /> : 'Continuar'}
            </button>

            <div className="authDivider">o</div>

            <button type="button" className="authButtonSecondary" onClick={() => {}}>
              Continuar con Google
            </button>

            <div className="authFooter">Al continuar aceptas nuestros Términos y Política de privacidad</div>
          </>
        )}

        {step === 'login' && (
          <>
            <h1 className="authTitle">Inicia sesión</h1>

            <div className="authEmailRow">
              <span className="authEmailRowText">{email}</span>
              <button type="button" className="authLink" onClick={handleEditEmail}>
                Editar
              </button>
            </div>

            <div className="authField">
              <label className="authLabel" htmlFor="login-password">
                Contraseña
              </label>
              <div className="authInputRow">
                <input
                  id="login-password"
                  ref={passwordInputRef}
                  className="authInput"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                />
                <button
                  type="button"
                  className="authToggleVisibility"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {loginError.length > 0 && <div className="authError">{loginError}</div>}
            </div>

            <button type="button" className="authLink" style={{ marginBottom: 16 }} onClick={() => {}}>
              ¿Olvidaste tu contraseña?
            </button>

            <button type="button" className="authButton" disabled={isLoggingIn} onClick={handleLogin}>
              {isLoggingIn ? <Spinner /> : 'Ingresar'}
            </button>
          </>
        )}

        {step === 'signup' && (
          <>
            <h1 className="authTitle">Crea tu cuenta</h1>

            <div className="fieldsRow">
              <div className="authField">
                <label className="authLabel" htmlFor="first-name">
                  Nombre
                </label>
                <input
                  id="first-name"
                  ref={firstNameInputRef}
                  className={`authInput${firstNameError ? ' invalid' : ''}`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => markTouched('firstName')}
                />
                {firstNameError.length > 0 && <div className="authError">{firstNameError}</div>}
              </div>

              <div className="authField">
                <label className="authLabel" htmlFor="last-name">
                  Apellido
                </label>
                <input
                  id="last-name"
                  className={`authInput${lastNameError ? ' invalid' : ''}`}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => markTouched('lastName')}
                />
                {lastNameError.length > 0 && <div className="authError">{lastNameError}</div>}
              </div>
            </div>

            <div className="authField">
              <label className="authLabel" htmlFor="signup-email">
                Email
              </label>
              <input id="signup-email" className="authInput" value={email} disabled readOnly />
            </div>

            <div className="authField">
              <label className="authLabel" htmlFor="signup-password">
                Contraseña
              </label>
              <div className="authInputRow">
                <input
                  id="signup-password"
                  className="authInput"
                  type={showSignupPassword ? 'text' : 'password'}
                  value={signupPassword}
                  autoComplete="new-password"
                  onChange={(e) => setSignupPassword(e.target.value)}
                  onBlur={() => markTouched('signupPassword')}
                />
                <button
                  type="button"
                  className="authToggleVisibility"
                  onClick={() => setShowSignupPassword((v) => !v)}
                  aria-label={showSignupPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showSignupPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <div className="strengthBarTrack">
                <div
                  className="strengthBarFill"
                  style={{
                    width: `${(signupScore / 4) * 100}%`,
                    background: getStrengthColor(signupScore),
                  }}
                />
              </div>

              <ul className="strengthChecklist">
                <li className={`strengthCheckItem${signupChecks.length ? ' met' : ''}`}>
                  <span className="strengthCheckMark">{signupChecks.length ? '✓' : '○'}</span>
                  Mínimo 8 caracteres
                </li>
                <li className={`strengthCheckItem${signupChecks.uppercase ? ' met' : ''}`}>
                  <span className="strengthCheckMark">{signupChecks.uppercase ? '✓' : '○'}</span>
                  Al menos una mayúscula
                </li>
                <li className={`strengthCheckItem${signupChecks.number ? ' met' : ''}`}>
                  <span className="strengthCheckMark">{signupChecks.number ? '✓' : '○'}</span>
                  Al menos un número
                </li>
                <li className={`strengthCheckItem${signupChecks.special ? ' met' : ''}`}>
                  <span className="strengthCheckMark">{signupChecks.special ? '✓' : '○'}</span>
                  Al menos un carácter especial (!@#$...)
                </li>
              </ul>
            </div>

            <div className="authField">
              <label className="authLabel" htmlFor="confirm-password">
                Confirmar contraseña
              </label>
              <div className="authInputRow">
                <input
                  id="confirm-password"
                  className={`authInput${confirmError ? ' invalid' : ''}`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => markTouched('confirmPassword')}
                />
                <button
                  type="button"
                  className="authToggleVisibility"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {confirmError.length > 0 && <div className="authError">{confirmError}</div>}
            </div>

            <button type="button" className="authLink" style={{ marginBottom: 16 }} onClick={handleEditEmail}>
              Usar otro correo
            </button>

            <button
              type="button"
              className="authButton"
              disabled={!signupFormValid || isSigningUp}
              onClick={handleSignUp}
            >
              {isSigningUp ? <Spinner /> : 'Crear cuenta'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
