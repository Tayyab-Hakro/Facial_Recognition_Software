import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="w-full bg-white shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Left side */}
        <h1 className="text-2xl font-semibold text-blue-600">
          Security Department
        </h1>

        {/* Center navigation */}
        <ul className="flex items-center gap-6 text-gray-700 font-medium">
          <li>
            <Link
              to="/"
              className="hover:text-blue-600 transition-colors duration-300"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/addguard"
              className="hover:text-blue-600 transition-colors duration-300"
            >
              Add Guard
            </Link>
          </li>
          <li>
            <Link
              to="/attendance"
              className="hover:text-blue-600 transition-colors duration-300"
            >
              Attendance
            </Link>
          </li>
        </ul>

        {/* Right side */}
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          Tayyab Hakro
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
