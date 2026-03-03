#!/usr/bin/env python3
"""Generate .ics calendar file for MWC Talent Arena March 4, 2026 – ALL recommended sessions."""

import subprocess
import uuid
from pathlib import Path

CALENDAR_FILE = Path(__file__).parent / "mwc_talent_arena_march4.ics"
TZ = "Europe/Madrid"
DATE = "20260304"


def event(start: str, end: str, title: str, location: str, description: str) -> str:
    uid = uuid.uuid4()
    desc = description.replace("\n", "\\n")
    return f"""\
BEGIN:VEVENT
DTSTART;TZID={TZ}:{DATE}T{start}00
DTEND;TZID={TZ}:{DATE}T{end}00
SUMMARY:{title}
LOCATION:Fira Montjuïc Hall 8 – {location}
DESCRIPTION:{desc}
UID:{uid}
STATUS:CONFIRMED
END:VEVENT"""


events = [
    # ━━━ 09:30 ━━━
    event("0930", "1000",
          "🤖 Confessions of a Vibecoding Engineer",
          "XPRO Stage",
          "Nicolás Grenié – Developer Advocate, ex-Typeform\\n"
          "How AI reshapes engineering roles – lessons from dozens of AI projects"),

    event("0930", "1030",
          "🏭 Nestlé: Innovation Through XR Across the Value Chain",
          "Hotspot Talks",
          "4 Nestlé speakers on XR adoption across the value chain\\n"
          "How a major corp drives immersive tech innovation"),

    event("0930", "1030",
          "💡 Innovation in Action: Reinventing and Accelerating Innovation",
          "Plug-in Talks",
          "Enterprise innovation strategies"),

    event("0930", "1030",
          "🔮 The Future of Edge AI and Physical AI",
          "XPRO Talks",
          "Arduino + Edge Impulse + Qualcomm – 5 speakers\\n"
          "Edge AI on microcontrollers, privacy-first AI, scalable ML"),

    event("0930", "1100",
          "🦀 From Frustrait-ion to Async Mastery: Become a Rust Trait",
          "Frontier Lab",
          "Hands-on Rust workshop – async patterns and traits"),

    # ━━━ 10:30 ━━━
    event("1030", "1100",
          "🎨 Creative Coding to Demystify Technology",
          "Visionary Stage",
          "Tim Roedenbroker – how coding empowers innovators"),

    event("1030", "1130",
          "🔄 Turning Silos into Synergy Through InnerSource",
          "XPRO Talks",
          "InnerSource practices for breaking down org silos – relevant for large pharma orgs"),

    # ━━━ 11:00 ━━━
    event("1100", "1130",
          "🚀 From 'Promstitution' to Impact: How Developers Stay Essential",
          "Visionary Stage",
          "How developers remain essential in the AI era (Spanish)"),

    event("1115", "1245",
          "👁️ Computer Vision with Arduino UNO Q: From Edge AI to VLMs",
          "XPRO Lab",
          "Hands-on workshop – computer vision on edge devices"),

    # ━━━ 11:30 ━━━
    event("1130", "1200",
          "📈 From Adoption to Impact: How Adoption Accelerates AI",
          "Visionary Stage",
          "Driving AI adoption to real business impact"),

    event("1130", "1230",
          "🌐 Scaling Science at Large Facilities: ALBA and BSC",
          "XPRO Talks",
          "How ALBA synchrotron and Barcelona Supercomputing Center scale science"),

    event("1130", "1230",
          "🔓 A More Accessible and Democratic Open-Source AI",
          "Plug-in Talks",
          "Open-source AI democratization (Spanish)"),

    # ━━━ 12:00 ━━━
    event("1200", "1230",
          "🏛️ The Future of Enterprise AI Governance",
          "Visionary Stage",
          "AI governance frameworks for enterprises – critical for pharma compliance"),

    # ━━━ 12:30 ━━━
    event("1230", "1330",
          "🍺 Tapas & Observability: Connect, Chat, Enjoy",
          "Meetup Area",
          "Networking meetup with food – observability community"),

    event("1230", "1330",
          "🔐 Cybersecurity Certification with Cisco",
          "XPRO Talks",
          "Zero to Hero cybersecurity path (Spanish)"),

    # ━━━ 13:00 ━━━
    event("1300", "1330",
          "🚀 AI Lift-Off: Escaping Prototype Gravity to Production",
          "XPRO Stage",
          "How to get AI from prototype to production – the gap every backend dev faces"),

    event("1300", "1430",
          "🤖 Build Your Own AI Agent – From Theory to Practice",
          "Frontier Lab",
          "CaixaBank Tech – 4 speakers\\n"
          "Hands-on: build and customize AI agents step by step (Spanish)"),

    # ━━━ 13:30 ━━━
    event("1330", "1430",
          "🏥 Responsible and Secure AI: Protect Your Org in the GenAI Era",
          "Barcelona Stage",
          "GFT + speakers – AI security and responsibility\\n"
          "Critical for pharma where AI governance is mandatory"),

    event("1330", "1430",
          "⚖️ AI with Purpose: Ethics That Transform Talent Management",
          "Hotspot Talks",
          "Ethical AI in talent management"),

    # ━━━ 15:00 ━━━
    event("1500", "1530",
          "😅 How to Survive an AI That's Trying to Replace You",
          "Visionary Stage",
          "Developer survival guide in the AI era (Spanish)"),

    event("1500", "1630",
          "☁️ Sovereign AI & FinOps: Cloud Control into Competitive Advantage",
          "XPRO Lab",
          "Hands-on workshop – AI sovereignty + cloud cost management\\n"
          "Relevant for enterprise/pharma cloud strategy"),

    # ━━━ 15:30 ━━━
    event("1530", "1600",
          "📱 From Devices to Digital: Building Connected Experiences",
          "Visionary Stage",
          "Connected device experiences"),

    event("1530", "1630",
          "🔧 Rebuild AI: Generative AI for Business (Live Demos)",
          "Plug-in Talks",
          "Live demos of generative AI business applications (Catalan)"),

    # ━━━ 16:30 ━━━
    event("1630", "1730",
          "🤖 From Digital to Agentic (A Realistic Approximation)",
          "Hotspot Talks",
          "Realistic take on the shift from digital to agentic systems"),

    event("1630", "1730",
          "⭐ Our AI Agents Are Finally in Production — And Now What?",
          "XPRO Talks",
          "Post-deployment challenges with AI agents in production\\n"
          "THE afternoon session – what happens after you ship agents"),

    # ━━━ 17:30 ━━━
    event("1730", "1830",
          "🦸 We Are Superhuman",
          "XPRO Talks",
          "Closing XPRO Talks session"),

    event("1730", "1830",
          "📚 10 Lessons I Would Have Said to the Me of 25 Years Ago",
          "Hotspot Talks",
          "Career retrospective and lessons learned"),

    # ━━━ 18:30 ━━━
    event("1830", "2030",
          "🍺 Closing Party",
          "Venue",
          "Last night networking!"),
]

VTIMEZONE = f"""\
BEGIN:VTIMEZONE
TZID:{TZ}
BEGIN:STANDARD
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
END:DAYLIGHT
END:VTIMEZONE"""

ics = f"""\
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MWC Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:MWC Talent Arena March 4
X-WR-TIMEZONE:{TZ}
{VTIMEZONE}
{chr(10).join(events)}
END:VCALENDAR"""

CALENDAR_FILE.write_text(ics, encoding="utf-8")
print(f"✅ Calendar file created: {CALENDAR_FILE}")
print(f"📅 {len(events)} events (overlapping sessions included)")
print("Opening in calendar app...")
subprocess.run(["open", str(CALENDAR_FILE)])
