import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/auth-context.js";
import Avatar from "./Avatar.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="wordmark">
          Roster
        </Link>
        <nav className="topnav" aria-label="Main">
          <NavLink to="/" end>
            My profile
          </NavLink>
          {user.role === "admin" && <NavLink to="/users">Students</NavLink>}
        </nav>
        <div className="topbar-user">
          <Avatar name={user.name} size="sm" />
          <span className="topbar-name">{user.name}</span>
          <button type="button" className="btn btn-quiet" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
