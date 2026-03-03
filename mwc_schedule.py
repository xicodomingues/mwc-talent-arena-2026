#!/usr/bin/env python3
"""Generate .ics calendar file for MWC Talent Arena March 3, 2026 – ALL recommended sessions."""

import subprocess
import uuid
from pathlib import Path

CALENDAR_FILE = Path(__file__).parent / "mwc_talent_arena_march3.ics"
TZ = "Europe/Madrid"
DATE = "20260303"


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
    event("0930", "1030",
          "💊 Roche: Closing the Velocity Gap – AI & Healthcare",
          "Plug-in Talks",
          "3 Roche speakers: Nicole Arbiv, Alex Morcillo, Laura Vidal Borrell\\n"
          "AI adoption in healthcare – governance, collaboration, execution"),

    event("0930", "1030",
          "🤖 Claude Code: Babysitting to Autonomous Agents",
          "Hotspot Talks",
          "Kate Marshalkina – Staff Engineer at Datavant\\n"
          "90-day playbook for AI coding agents in real-world repos"),

    # ━━━ 10:30 ━━━
    event("1030", "1100",
          "📚 Linux Foundation: Learning at the Speed of AI",
          "Visionary Stage",
          "Timothy Serewicz – VP Education, Linux Foundation\\n"
          "Upskilling strategies in the AI era"),

    event("1030", "1130",
          "💼 The AI-Ready Workforce: Who Thrives, Who Survives?",
          "XPRO Talks",
          "Who succeeds in AI-transformed orgs – career strategy"),

    # ━━━ 11:00 ━━━
    event("1100", "1130",
          "🚀 From Idea to Product: Rethinking How We Build",
          "XPRO Stage",
          "How product building changes with AI – senior dev perspective"),

    # ━━━ 11:15 ━━━
    event("1115", "1245",
          "🔧 Giving AI Agents Superpowers: Connecting to the Real World",
          "Frontier Lab",
          "Hands-on workshop – connecting AI agents to real-world systems"),

    # ━━━ 11:30 ━━━
    event("1130", "1230",
          "💊 Sanofi: PLAI – Data & AI Democratization",
          "Hotspot Talks",
          "How Sanofi structures data and AI across the org"),

    # ━━━ 12:30 ━━━
    event("1230", "1300",
          "💊 Roche: From Data to Impact – AI Rewriting Healthcare",
          "Visionary Stage",
          "Second Roche session – more impact-focused"),

    event("1230", "1300",
          "⚙️ Engineering in the Age of AI – Why Fundamentals Matter",
          "XPRO Stage",
          "Why solid engineering foundations still matter with AI"),

    # ━━━ 13:00 ━━━
    event("1300", "1330",
          "☕ Lunch Break",
          "Food area",
          "Recharge before the afternoon"),

    # ━━━ 13:30 ━━━
    event("1330", "1430",
          "📊 From Data Stack Challenges to AI-Ready Scale",
          "XPRO Talks",
          "Lessons learned scaling data infrastructure for AI"),

    event("1330", "1430",
          "👨‍💻 Evolution of Developer's Role in Era of Agents",
          "Plug-in Talks",
          "How the developer role is shifting with AI agents (Spanish)"),

    event("1330", "1430",
          "🏥 Managing Transformation: AI Reshapes Health Orgs",
          "Barcelona Stage",
          "AI transformation in healthcare organizations"),

    event("1330", "1430",
          "🎙️ Fireside Chat: Kate Darling",
          "Visionary Stage",
          "Kate Darling – MIT robotics researcher\\n"
          "Inspiring conversation about robots and society"),

    # ━━━ 15:00 ━━━
    event("1500", "1515",
          "📱 From Code to Capability: New App Experiences",
          "XPRO Stage",
          "Quick 15-min talk on unlocking new app experiences"),

    event("1500", "1630",
          "🛠️ Boosting Productivity with AI: Hands-On Workshop",
          "Focus Lab",
          "Practical workshop on AI-assisted productivity"),

    event("1515", "1530",
          "🔑 Auth for the AI Era: Passwordless Security",
          "XPRO Stage",
          "Build passwordless security patterns"),

    # ━━━ 15:45 ━━━
    event("1545", "1600",
          "🔌 Agent Protocols to Real-World API Integration",
          "XPRO Stage",
          "From agent protocols to real apps – practical backend"),

    event("1530", "1630",
          "🔄 How AI Is Redefining the Software Lifecycle",
          "XPRO Talks",
          "Impact of AI across the entire software development lifecycle"),

    # ━━━ 16:00 ━━━
    event("1600", "1645",
          "⚽ How AI Is Boosting Barça's Edge",
          "Visionary Stage",
          "87-minute game – AI + football analytics"),

    # ━━━ 16:45 ━━━
    event("1645", "1815",
          "⭐ Building AI Agents with Spring AI",
          "XPRO Lab",
          "THE session. Java + Spring + AI Agents.\\n"
          "90 min hands-on workshop. XPRO exclusive."),

    event("1645", "1700",
          "🔒 Secure MCP Servers with OAuth, JWT, SPIFFE",
          "XPRO Stage",
          "MCP security – cutting-edge, 15 min only"),

    # ━━━ 18:30 ━━━
    event("1830", "2030",
          "🍺 Talent Arena Party by Estrella Damm",
          "Visionary Stage",
          "Networking!"),
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
X-WR-CALNAME:MWC Talent Arena March 3
X-WR-TIMEZONE:{TZ}
{VTIMEZONE}
{chr(10).join(events)}
END:VCALENDAR"""

CALENDAR_FILE.write_text(ics, encoding="utf-8")
print(f"✅ Calendar file created: {CALENDAR_FILE}")
print(f"📅 {len(events)} events (overlapping sessions included)")
print("Opening in calendar app...")
subprocess.run(["open", str(CALENDAR_FILE)])
