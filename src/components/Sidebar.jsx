const navItems = [
  { id: "discover", icon: "⌂", label: "Discover" },
  { id: "find", icon: "✳", label: "Find my movie" },
  { id: "watchlist", icon: "♡", label: "My watchlist" },
];

function Sidebar({ activePage, onNavigate, savedCount }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">C</div>
        <div>
          <h1>CineMatch</h1>
          <span>MOVIE DISCOVERY</span>
        </div>
      </div>

      <p className="sidebar-label">MENU</p>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>

            {item.id === "watchlist" && savedCount > 0 && (
              <span className="nav-count">{savedCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="note-icon">✦</span>
          <p>Your next favourite film is just a match away.</p>
        </div>
        <span className="sidebar-version">CINEMATCH · VERSION 1.0</span>
      </div>
    </aside>
  );
}

export default Sidebar;
