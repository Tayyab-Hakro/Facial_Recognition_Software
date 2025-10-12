import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Addguard from "./pages/Addguard";
import Attendence from "./pages/Attendence";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <Navbar />
      <div className="p-6">
        <Routes>
          <Route path="/addguard" element={<Addguard />} />
          <Route path="/attendance" element={<Attendence />} />
          <Route
            path="/"
            element={
              <h2 className="text-xl font-semibold text-center mt-10">
                Welcome to Security Department Dashboard
              </h2>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
