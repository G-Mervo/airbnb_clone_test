import React, { useState } from "react";

const inspirationLinks = {
  "unique-stays": [
    { title: "Cabins", location: "United States" },
    { title: "Treehouses", location: "United States" },
    { title: "Beachfront", location: "United States" },
    { title: "Lake houses", location: "United States" },
    { title: "Farm stays", location: "United States" },
    { title: "Tiny homes", location: "United States" }
  ],
  categories: [
    { title: "Amazing views", location: "United States" },
    { title: "Iconic cities", location: "United States" },
    { title: "Countryside", location: "United States" },
    { title: "Desert", location: "United States" },
    { title: "Tropical", location: "United States" },
    { title: "Skiing", location: "United States" }
  ],
  "things-to-do": [
    { title: "Experiences", location: "United States" },
    { title: "Concerts", location: "United States" },
    { title: "Museums", location: "United States" },
    { title: "Parks", location: "United States" },
    { title: "Nightlife", location: "United States" },
    { title: "Festivals", location: "United States" }
  ]
};

const supportLinks = [
  "Help Center",
  "AirCover",
  "Anti-discrimination",
  "Disability support",
  "Cancellation options",
  "Report neighborhood concern"
];

const hostingLinks = [
  "Airbnb your home",
  "AirCover for Hosts",
  "Hosting resources",
  "Community forum",
  "Responsible hosting"
];

const airbnbLinks = [
  "Newsroom",
  "New features",
  "Careers",
  "Investors",
  "Gift cards"
];

export default function Footer() {
  const [activeTab, setActiveTab] = useState("unique-stays");

  return (
    <footer className="w-full bg-gray-100 pt-12 relative z-0 border-t border-gray-200">
      <div className="w-full 1xl:px-20 px-6">
        <section className="pb-12 border-b border-gray-300 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Inspiration for future getaways</h2>
          <div className="flex border-b border-gray-300 mb-8">
            <button
              className={`pb-4 px-4 -mb-[1px] text-lg font-medium ${
                activeTab === "unique-stays" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("unique-stays")}
            >
              Unique stays
            </button>
            <button
              className={`pb-4 px-4 -mb-[1px] text-lg font-medium ${
                activeTab === "categories" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("categories")}
            >
              Categories
            </button>
            <button
              className={`pb-4 px-4 -mb-[1px] text-lg font-medium ${
                activeTab === "things-to-do" ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("things-to-do")}
            >
              Things to do
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6 text-left">
            {inspirationLinks[activeTab].map((link, index) => (
              <div key={index} className="block text-gray-900">
                <p className="font-medium text-base">{link.title}</p>
                <p className="text-gray-600 text-sm">{link.location}</p>
              </div>
            ))}
            {activeTab === "unique-stays" && (
              <div className="block text-gray-900 flex items-center">
                <p className="font-medium text-base">Show more</p>
                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-b border-gray-300 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <span className="text-gray-600 text-sm">{link}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Hosting</h3>
            <ul className="space-y-2">
              {hostingLinks.map((link, index) => (
                <li key={index}>
                  <span className="text-gray-600 text-sm">{link}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Airbnb</h3>
            <ul className="space-y-2">
              {airbnbLinks.map((link, index) => (
                <li key={index}>
                  <span className="text-gray-600 text-sm">{link}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-between py-6 text-gray-600 text-sm">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <span>&copy; 2025 Airbnb, Inc.</span>
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Terms</span>
            <span className="cursor-default">Sitemap</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 010 20" />
                <path d="M12 2a15.3 15.3 0 000 20" />
              </svg>
              <span>English (US)</span>
              <span className="font-semibold">$ USD</span>
            </div>
            <div className="flex items-center space-x-4">
              <span aria-label="Facebook">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.5 9.87v-6.99H8.9V12h1.6V9.8c0-1.58.94-2.45 2.38-2.45.69 0 1.41.12 1.41.12v1.55h-.79c-.78 0-1.02.49-1.02 1V12h1.74l-.28 2.88h-1.46v6.99A10 10 0 0022 12z"/></svg>
              </span>
              <span aria-label="Twitter">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.26 4.26 0 001.87-2.35 8.51 8.51 0 01-2.7 1.03A4.24 4.24 0 0015.5 4a4.24 4.24 0 00-4.24 4.24c0 .33.04.65.11.95A12.05 12.05 0 013 5.16a4.24 4.24 0 001.31 5.66 4.2 4.2 0 01-1.92-.53v.05a4.24 4.24 0 003.4 4.16c-.47.13-.98.2-1.5.2-.36 0-.72-.03-1.06-.1a4.24 4.24 0 003.96 2.95A8.5 8.5 0 012 19.54 12.02 12.02 0 008.29 21c7.55 0 11.69-6.26 11.69-11.69 0-.18 0-.36-.01-.53A8.35 8.35 0 0022.46 6z"/></svg>
              </span>
              <span aria-label="Instagram">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm6.5-1.5a1 1 0 100 2 1 1 0 000-2z"/></svg>
              </span>
            </div>
          </div>
        </section>
      </div>
    </footer>
  );
}
