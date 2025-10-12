import React, { useState } from "react";
import axios from "axios";

function Addguard() {
  const [form, setForm] = useState({
    name: "",
    image: [],
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({
      ...form,
      [name]: files ? Array.from(files) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      form.image.forEach((img) => formData.append("images", img));

      const response = await axios.post("http://localhost:3000/addguards", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        alert("Data sent successfully!");
        setForm({ name: "", image: [] });
      } else {
        alert("Something went wrong!");
      }
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Add New Security Guard
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guard Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter guard's full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Guard Image(s)
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              multiple
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold shadow-md"
          >
            Add Guard
          </button>
        </form>
      </div>
    </div>
  );
}

export default Addguard;
