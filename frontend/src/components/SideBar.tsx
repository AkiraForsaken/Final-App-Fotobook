import { NavLink } from "react-router-dom"
export type NavItem = {
  label: string;
  to: string; // e.g "/feeds"
  icon: string; // font-awesome class name
};

interface SideBarProps {
  items: NavItem[];
  mobileOpen: boolean;
  onClose: () => void;
}

const SideBarItem = ({ item, onClick }: { item: NavItem, onClick?: () => void }) => (
  <NavLink
    to={item.to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors 
      ${isActive ? "bg-blue-50 text-blue-800" : "text-gray-700 hover:bg-gray-200"}`
    }
  >
    <i className={`${item.icon} w-5 text-center`} />
    {item.label}
  </NavLink>
);

export const SideBar = ({ items, mobileOpen, onClose }: SideBarProps) => {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col min-w-56 shrink-0 bg-gray-100 py-4">
        <nav className="flex flex-col space-y-1 px-1">
          {items.map((item) => (
            <SideBarItem key={item.to} item={item} />
          ))}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-white shadow-lg transform transition-transform duration-200 ease-in-out sm:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-14 items-center justify-end px-4">
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <nav className="mt-2 space-y-1 px-2">
          {items.map((item) => (
            <SideBarItem key={item.to} item={item} onClick={onClose} />
          ))}
        </nav>
      </aside>
    </>
  );
};