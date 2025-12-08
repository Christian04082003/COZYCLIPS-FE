import React from "react";
import fbIcon from "../assets/fb.png";
import googleIcon from "../assets/google.png";
import twitterIcon from "../assets/twitter.png";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-10 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-start">

        <div className="flex flex-col items-start gap-3">
          <img
            src="/logo.png"
            alt="CozyClips Logo"
            className="h-10 w-auto sm:h-12 md:h-14 object-contain"
          />
          <p className="text-sm text-gray-400">
            CozyClips Stories – Interactive Reading for Everyone.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li><a href="#" className="hover:underline">Leaderboards</a></li>
            <li><a href="#" className="hover:underline">Shop</a></li>
            <li><a href="#" className="hover:underline">About Us</a></li>
            <li><a href="#" className="hover:underline">Contact Us</a></li>
            <li><a href="#" className="hover:underline">FAQs</a></li>
          </ul>
        </div>

        {/* CONTACTS */}
        <div>
          <h3 className="font-semibold mb-3">Contacts</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-center gap-2 hover:text-gray-100 transition">
              <img src={fbIcon} alt="Facebook" className="h-5 w-5 object-contain" />
              @CozyClipsStories
            </li>
            <li className="flex items-center gap-2 hover:text-gray-100 transition">
              <img src={googleIcon} alt="Google" className="h-5 w-5 object-contain" />
              @CozyClips
            </li>
            <li className="flex items-center gap-2 hover:text-gray-100 transition">
              <img src={twitterIcon} alt="Twitter" className="h-5 w-5 object-contain" />
              @CozyClips
            </li>
          </ul>
        </div>

        {/* LINKS */}
        <div>
          <h3 className="font-semibold mb-3">Legal</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li><a href="#" className="hover:underline">Privacy Policy</a></li>
            <li><a href="#" className="hover:underline">Terms of Service</a></li>
            <li><a href="#" className="hover:underline">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-8 border-t border-gray-800 pt-4">
        © 2025 CozyClips Stories. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;