import React from "react";
import { Link } from "react-router-dom";
import { NotebookText } from "lucide-react";

const Intro = () => {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl transition-all duration-500">
        <div className="text-center py-10">
          <div className="flex justify-center mb-6 text-gray-800">
            <NotebookText size={48} strokeWidth={2} />
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tighter mb-4">
            GAH Notemaker
          </h1>
          <p className="text-gray-500 mb-10 text-lg">
            Your minimalist space for thoughts and ideas.
          </p>

          <div className="flex flex-col gap-4">
            <Link
              to="/login"
              className="w-full flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all duration-300 active:scale-95"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="w-full flex justify-center py-3 px-6 border border-gray-200 rounded-xl text-lg font-semibold text-gray-700 bg-white hover:bg-gray-100 transition-all duration-300 active:scale-95 shadow-sm"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intro;
