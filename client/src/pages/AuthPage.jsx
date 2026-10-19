import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context.js";
import Avatar from "../components/Avatar.jsx";
import { roleLabel } from "../roles.js";

const PREVIEW = [
  { name: "Amara Perera", email: "amara@college.edu", role: "admin" },
  { name: "Kavin Raj", email: "kavin@college.edu", role: "user" },
  { name: "Nadia Hussain", email: "nadia@college.edu", role: "user" },
  { name: "Tharun Silva", email: "tharun@college.edu", role: "user" },
];

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function validate(mode, { name, email, password }) {
  const errors = {};
  if (mode === "register") {
    if (name.trim().length < 2 || name.trim().length > 50) {
      errors.name = "Enter a name between 2 and 50 characters.";
    }
  }
  if (!EMAIL_RE.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (mode === "register" ? password.length < 6 : password.length === 0) {
    errors.password =
      mode === "register"
        ? "Use at least 6 characters."
        : "Enter your password.";
  }
  return errors;
}

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { user, loading, login, register } = useAuth();
  const location = useLocation();

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (loading) {
    return (
      <div className="screen-center" role="status">
        Loading your session…
      </div>
    );
  }
  if (user) {
    return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
    setServerError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(mode, values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setServerError("");
    try {
      if (isRegister) {
        await register(values.name.trim(), values.email.trim(), values.password);
      } else {
        await login(values.email.trim(), values.password);
      }
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth-side">
        <span className="wordmark wordmark-light">Roster</span>
        <div className="auth-pitch">
          <h1>Your student account, all in one place.</h1>
          <p>
            Register once, keep your details up to date, and sign in from
            anywhere. Staff can manage every student record.
          </p>
        </div>
        <ul className="preview" aria-hidden="true">
          {PREVIEW.map((p, i) => (
            <li key={p.email} className="preview-row" style={{ "--i": i }}>
              <Avatar name={p.name} tone={p.role === "admin" ? "amber" : "mint"} />
              <span className="preview-who">
                <strong>{p.name}</strong>
                <span>{p.email}</span>
              </span>
              <span className={`role role-${p.role}`}>{roleLabel(p.role)}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="auth-main">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <h2>{isRegister ? "Create your student account" : "Sign in"}</h2>
          <p className="auth-sub">
            {isRegister
              ? "Use your college email if you have one."
              : "Welcome back. Sign in to see your student profile."}
          </p>

          {serverError && (
            <div className="banner banner-error" role="alert">
              {serverError}
            </div>
          )}

          {isRegister && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-err" : undefined}
              />
              {errors.name && (
                <p className="field-error" id="name-err">
                  {errors.name}
                </p>
              )}
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-err" : undefined}
            />
            {errors.email && (
              <p className="field-error" id="email-err">
                {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={values.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-err" : undefined}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="field-error" id="password-err">
                {errors.password}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting
              ? isRegister
                ? "Creating account…"
                : "Signing in…"
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>

          <p className="auth-switch">
            {isRegister ? (
              <>
                Already have an account? <Link to="/login">Sign in</Link>
              </>
            ) : (
              <>
                New here? <Link to="/register">Create an account</Link>
              </>
            )}
          </p>
        </form>
      </main>
    </div>
  );
}
