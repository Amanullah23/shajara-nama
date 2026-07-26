"use client";

import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faMagnifyingGlass,
  faChevronDown,
  faGauge,
  faUsers,
  faSitemap,
  faFolderTree,
  faImages,
  faCalendarDays,
  faNewspaper,
  faUserShield,
  faBell,
  faGear,
  faUser,
  faCircleQuestion,
  faKey,
  faClipboardList,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

type GuideSection = {
  id: string;
  icon: any;
  title: string;
  items: { heading: string; steps: string[] }[];
};

const SECTIONS: GuideSection[] = [
  {
    id: "getting-started",
    icon: faKey,
    title: "Getting Started",
    items: [
      {
        heading: "Logging in",
        steps: [
          "Go to /login and enter the email and password given to you by an administrator.",
          "New accounts are created directly by a Super Admin — there is no public sign-up form, since this is a private family archive.",
          "Once logged in, you'll land on the Dashboard, which is your home base for everything in the system.",
        ],
      },
      {
        heading: "Understanding roles",
        steps: [
          "Super Admin: full access to everything, including creating and managing other users.",
          "Branch Admin: manages members and data within their assigned family branch.",
          "Editor: can add and edit family members, photos, and events, but cannot delete records or manage users.",
          "Family Member: can view the tree and family-tier information, update their own profile, and RSVP to events.",
          "Guest: read-only access to public information, similar to what an anonymous website visitor sees.",
        ],
      },
      {
        heading: "Securing your account",
        steps: [
          'Forgot your password? Click "Forgot password?" on the login page and check your email for a reset link.',
          "For extra security, set up Two-Factor Authentication (2FA) from your Profile page — scan a QR code with an app like Google Authenticator, then enter the 6-digit code it shows you.",
          "Once 2FA is turned on, you'll be asked for a fresh code every time you log in, in addition to your password.",
          "Turning 2FA off requires entering one more valid code first, as a safety check.",
        ],
      },
    ],
  },
  {
    id: "dashboard",
    icon: faGauge,
    title: "Dashboard",
    items: [
      {
        heading: "What you'll see",
        steps: [
          "Quick stats: total members, living/deceased counts, gender breakdown, and number of branches.",
          "Recent Activity: a live feed of the newest additions and edits across the whole family tree.",
          "Upcoming: birthdays and events coming up soon.",
          'The header shows your detected location and today\'s date next to "Welcome back."',
        ],
      },
    ],
  },
  {
    id: "members",
    icon: faUsers,
    title: "Members",
    items: [
      {
        heading: "Adding a person",
        steps: [
          'Go to Members → Add Person, or click "Add Person" from the sidebar.',
          "Fill in as much as you know — only Full Name is required, everything else can be added later.",
          "Upload a profile photo using the camera icon at the top of the form.",
          "Set Father, Mother, or Spouse from the dropdowns to connect them into the family tree automatically.",
          'Check "This person is deceased" to reveal death date, place, and burial location fields.',
        ],
      },
      {
        heading: "Editing, viewing, and deleting",
        steps: [
          "Use the search box and Status/Branch filters on the Members page to quickly find someone.",
          "Click the green eye icon to open their full View Details page — bio, family, photos, documents, and activity history.",
          "Click the navy pencil icon to edit their information.",
          "Click the red trash icon to delete a person — you'll always be asked to confirm first, since this cannot be undone.",
        ],
      },
    ],
  },
  {
    id: "family-tree",
    icon: faSitemap,
    title: "Family Tree Manager",
    items: [
      {
        heading: "Navigating the tree",
        steps: [
          "Scroll or pinch to zoom, click and drag to pan around a large tree.",
          "Click any person's card to select them and see their details and actions in the side panel.",
          "Search for someone by name using the search box above the tree — selecting a result will automatically reveal them even if their branch is collapsed.",
        ],
      },
      {
        heading: "Expanding and collapsing branches",
        steps: [
          "Every person with children shows a small colored dot below their card.",
          "A gold dot with a minus (−) means that branch is expanded — click it to collapse it.",
          "A navy dot with a plus (+) means that branch is collapsed — click it to expand it again.",
          'Use "Expand All" and "Collapse All" in the toolbar to do this for the entire tree at once.',
        ],
      },
      {
        heading: "Highlighting and exporting a branch",
        steps: [
          'Select anyone in the tree, then click "Highlight This Branch" to color their entire lineage and automatically expand it for viewing.',
          'Click "Export / Print Branch" to generate a roster of that person and every descendant, grouped by generation — with buttons to export as CSV or print/save as PDF.',
        ],
      },
      {
        heading: "Finding how two people are related",
        steps: [
          'Click the two-arrow icon in the toolbar to open "Compare Relationship."',
          "Select any two people — the system will tell you exactly how they're related (parent, sibling, cousin, aunt/uncle, etc.) and compare their ages.",
          'If a blood relationship is found, click "Show This Path in the Tree" to highlight the connecting people directly on the tree in a different color, with a "Clear" button to remove it afterward.',
          "Every person's card also shows a breadcrumb trail back to the family's root ancestor when selected — click any name in that trail to jump straight to them.",
        ],
      },
      {
        heading: "Printing a family branch",
        steps: [
          'Select anyone in the tree, then click "Export / Print Branch" in the side panel.',
          "This generates a roster of that person and every descendant below them, organized by generation.",
          'From there, export it as a CSV spreadsheet, or use "Print / Save as PDF" for a clean, printable document.',
        ],
      },
      {
        heading: "Other tools",
        steps: [
          '"Add Child" pre-fills the Father field so you can quickly add someone\'s son or daughter.',
          '"Merge Duplicates" combines two person records into one if the same person was accidentally entered twice — all their relationships, photos, and documents transfer automatically.',
          '"Export CSV" downloads a spreadsheet of every person in the system.',
        ],
      },
    ],
  },
  {
    id: "branches",
    icon: faFolderTree,
    title: "Branches",
    items: [
      {
        heading: "Managing family branches",
        steps: [
          "A branch represents a major sub-lineage of the family — usually descendants of one particular ancestor.",
          'Click "Add Branch" to create one, giving it a name, description, and founder.',
          "Each branch card shows how many members are currently assigned to it.",
          "A branch with members assigned cannot be deleted until those members are reassigned to a different branch first — this protects against orphaned data.",
        ],
      },
    ],
  },
  {
    id: "media",
    icon: faImages,
    title: "Gallery & Documents",
    items: [
      {
        heading: "Uploading files",
        steps: [
          "Switch between the Photos and Documents tabs at the top of the page.",
          "Click the dashed upload area to select one or more files from your device.",
          "Photos accept JPG/PNG; Documents accept PDF, DOC, and DOCX.",
        ],
      },
      {
        heading: "Approving photos for public view",
        steps: [
          "By default, every uploaded photo is private — only logged-in family members can see it.",
          "Hover a photo and click the checkmark badge (top-left) to approve it for the public homepage gallery.",
          "A green checkmark badge means the photo is currently public; click it again to make it private again.",
          "Documents are never shown publicly — they remain visible to logged-in members and admins only.",
        ],
      },
    ],
  },
  {
    id: "events",
    icon: faCalendarDays,
    title: "Events & RSVP",
    items: [
      {
        heading: "Creating events",
        steps: [
          'Click "Add Event" and choose a type: Birthday, Anniversary, or Gathering.',
          "Gatherings can include a location and allow family members to RSVP.",
        ],
      },
      {
        heading: "RSVPing to a gathering",
        steps: [
          "Family members can visit the public /events page (while logged in) to see upcoming events.",
          "Click Going, Maybe, or Can't Go on any gathering — your response updates instantly and is reflected back in the admin Events page's attendance count.",
        ],
      },
    ],
  },
  {
    id: "blog",
    icon: faNewspaper,
    title: "Blog",
    items: [
      {
        heading: "Writing and publishing posts",
        steps: [
          "Go to Blog → New Post. A URL-friendly slug is generated automatically from the title as you type.",
          'Write your content, add an optional short excerpt for the listing page, then check "Publish immediately" or save it as a draft.',
          "Drafts are only visible in the admin panel — they won't appear on the public /blog page until published.",
          "Use the eye icon on the Blog list to publish or unpublish a post at any time, and the pencil icon to edit it.",
        ],
      },
    ],
  },
  {
    id: "users",
    icon: faUserShield,
    title: "Users & Roles",
    items: [
      {
        heading: "Inviting vs. creating accounts",
        steps: [
          '"Invite User" sends an account creation flow tied to their email — available to Super Admins and Branch Admins.',
          '"Create User" (Super Admin only) sets up a ready-to-use login immediately with a password you choose — no email step required. Share the password with them directly and securely.',
          "Super Admin accounts cannot be created through either form, as a safety measure — that step is done manually for extra protection.",
        ],
      },
      {
        heading: "Managing existing users",
        steps: [
          "Click the pencil icon next to any user to change their role or assigned branch.",
          "Click the trash icon to permanently delete a user's account — this cannot be undone.",
          "This entire page is only visible and accessible to Super Admins.",
        ],
      },
    ],
  },
  {
    id: "approvals",
    icon: faClipboardList,
    title: "Pending Approvals",
    items: [
      {
        heading: "How the approval workflow works",
        steps: [
          'If "Require admin approval before new profile edits go live" is turned on in Settings, changes made by Editors are held for review instead of appearing immediately.',
          'Super Admins and Branch Admins see a new "Approvals" item in the sidebar showing everyone waiting for review.',
          'Click "View proposed data" on any submission to see exactly what was submitted before deciding.',
          "Click the green checkmark to approve — this applies the change for real and removes it from the queue.",
          "Click the red X to reject — the change is discarded and never applied.",
          "Branch Admins and Super Admins are always trusted to make changes directly, regardless of this setting — it only applies to Editors.",
        ],
      },
    ],
  },
  {
    id: "notifications",
    icon: faBell,
    title: "Notifications",
    items: [
      {
        heading: "How notifications work",
        steps: [
          "Notifications are generated automatically — for new members added, profile updates, photo uploads, new events, and RSVPs.",
          "The bell icon in the top bar shows a live count of unread notifications.",
          'Use "Mark all as read" to clear the badge, or hover a single notification for a quick mark-as-read or dismiss option.',
          "Which notification types appear can be turned on or off from the Settings page.",
        ],
      },
    ],
  },
  {
    id: "settings",
    icon: faGear,
    title: "Settings",
    items: [
      {
        heading: "What Settings controls",
        steps: [
          "General: the family's display name and public contact email.",
          "Privacy Defaults: whether the public tree and gallery are visible to anonymous visitors, and what logged-in family members can see by default.",
          "Language: default site language (Dari support is planned for the future).",
          "Notifications: which notification types are generated system-wide.",
          "These settings apply to the entire system, not just your own account — changes here affect everyone.",
        ],
      },
    ],
  },
  {
    id: "profile",
    icon: faUser,
    title: "My Profile",
    items: [
      {
        heading: "Managing your own account",
        steps: [
          "Update your display name, phone number, and link your account to your own entry in the family tree.",
          "Change your password by entering your current password and a new one.",
          "Click Log Out at any time from the top-right of your profile card or the top bar.",
        ],
      },
    ],
  },
  {
    id: "member-dashboard",
    icon: faUserGroup,
    title: "Member Dashboard (Family Members)",
    items: [
      {
        heading: "What Family Members see",
        steps: [
          "Family Members are taken to a simplified Dashboard at /dashboard instead of the full admin panel — Editors, Branch Admins, and Super Admins keep using the admin panel as normal.",
          "The dashboard shows your linked family profile (if you're connected to one), plus quick links to the Family Tree, Events, Gallery, and Blog.",
          "From My Profile, you can update your display name and phone, link yourself to your entry in the family tree, change your password, and set up two-factor authentication — all the same account tools available in the full admin panel.",
          "If your account isn't linked to anyone yet, visit My Profile to link yourself, or ask an admin to do it for you.",
        ],
      },
    ],
  },
];

export default function GuidePage() {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["getting-started"]),
  );
  const [search, setSearch] = useState("");

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function scrollTo(id: string) {
    setOpenSections((prev) => new Set(prev).add(id));
    setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.map((section) => {
      const matchingItems = section.items.filter(
        (item) =>
          item.heading.toLowerCase().includes(q) ||
          item.steps.some((s) => s.toLowerCase().includes(q)) ||
          section.title.toLowerCase().includes(q),
      );
      return { ...section, items: matchingItems };
    }).filter(
      (section) =>
        section.items.length > 0 || section.title.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[var(--color-navy)] flex items-center justify-center shrink-0">
          <FontAwesomeIcon
            icon={faBook}
            className="text-[var(--color-gold)] text-lg"
          />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
            User Guide
          </h2>
          <p className="font-body text-[var(--color-ink)]/60 mt-0.5 text-sm">
            Everything you need to know to use Shajara Nama, from getting
            started to advanced tools.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 text-sm"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the guide..."
          className="w-full font-body text-sm bg-white border border-[var(--color-navy)]/15 rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
        />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Table of contents */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl p-4 sticky top-6">
            <p className="font-body text-xs uppercase tracking-wide text-[var(--color-ink)]/50 px-2 mb-2">
              Contents
            </p>
            <ul className="space-y-0.5">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-lg font-body text-sm text-[var(--color-ink)]/70 hover:bg-[var(--color-navy)]/5 hover:text-[var(--color-navy)] transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={s.icon}
                      className="text-[var(--color-gold)] text-xs w-4"
                    />
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sections */}
        <div className="lg:col-span-3 space-y-4">
          {filteredSections.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink)]/50 text-center py-16">
              No guide topics match "{search}".
            </p>
          ) : (
            filteredSections.map((section) => {
              const isOpen = openSections.has(section.id) || !!search.trim();
              return (
                <div
                  key={section.id}
                  id={section.id}
                  className="bg-white/70 border border-[var(--color-navy)]/10 rounded-2xl overflow-hidden scroll-mt-6"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between gap-3 p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-navy)] flex items-center justify-center shrink-0">
                        <FontAwesomeIcon
                          icon={section.icon}
                          className="text-[var(--color-gold)] text-sm"
                        />
                      </div>
                      <h3 className="font-display text-base md:text-lg font-semibold text-[var(--color-navy)]">
                        {section.title}
                      </h3>
                    </div>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`text-[var(--color-navy)]/40 text-sm transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 space-y-5">
                      {section.items.map((item, i) => (
                        <div key={i}>
                          <h4 className="font-body text-sm font-semibold text-[var(--color-navy)] mb-2">
                            {item.heading}
                          </h4>
                          <ul className="space-y-1.5">
                            {item.steps.map((step, j) => (
                              <li
                                key={j}
                                className="font-body text-sm text-[var(--color-ink)]/75 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--color-gold)]"
                              >
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="bg-[var(--color-navy)]/[0.03] border border-[var(--color-navy)]/10 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faCircleQuestion}
                className="text-[var(--color-gold)] text-lg shrink-0 mt-0.5"
              />
              <div>
                <p className="font-body text-sm text-[var(--color-ink)]/70">
                  Still have a question that isn't covered here? Reach out to a
                  Super Admin or Branch Admin — they can help directly or update
                  this guide for everyone.
                </p>
                <a
                  href="https://wa.me/93787484323"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 font-body text-sm font-medium text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-4 py-2 rounded-full hover:bg-[var(--color-emerald)]/20 transition-colors"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="text-base" />
                  Message Amanullah Yawari on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
