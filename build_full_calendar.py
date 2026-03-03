#!/usr/bin/env python3
"""Generate .ics with ALL Talent Arena sessions for March 3 & 4, grouped by stage."""

import subprocess
import uuid
from pathlib import Path

CALENDAR_FILE = Path(__file__).parent / "mwc_talent_arena_ALL.ics"
TZ = "Europe/Madrid"

def ev(day, start, end, title, stage, lang):
    uid = uuid.uuid4()
    date = f"202603{day:02d}"
    emoji = {"XPRO STAGE":"🟡","XPRO LAB":"🟡","XPRO TALKS":"🟡","VISIONARY STAGE":"🟣",
             "HOTSPOT TALKS":"🔵","PLUG-IN TALKS":"🟠","FOCUS LAB":"🟢","FRONTIER LAB":"🟢",
             "MEETUP AREA":"⚪","BARCELONA":"🔴","SKILLS HUB":"⚫","ROBOTICS":"🤖","GAMING":"🎮"}.get(stage,"📌")
    return f"""BEGIN:VEVENT
DTSTART;TZID={TZ}:{date}T{start}00
DTEND;TZID={TZ}:{date}T{end}00
SUMMARY:{emoji} {title}
LOCATION:Fira Montjuïc Hall 8 – {stage}
DESCRIPTION:Stage: {stage} | Language: {lang}
CATEGORIES:{stage}
UID:{uid}
STATUS:CONFIRMED
END:VEVENT"""

# ALL sessions extracted from talentarena.tech
# Format: (day, start, end, title, stage, lang)
ALL = [
# ══════════════════ MARCH 3 ══════════════════
(3,"0930","1000","It's Not Just Another Bot: Inspirational Agent for Shopping","XPRO STAGE","ES"),
(3,"0930","1000","Road to AGI: A Road with Curves – DotCSV","VISIONARY STAGE","ES"),
(3,"0930","1030","Talent, AI, and Productivity in Software Engineering – CaixaBank","MEETUP AREA","ES"),
(3,"0930","1030","Onboarding Claude Code: Babysitting to Autonomous Agents","HOTSPOT TALKS","EN"),
(3,"0930","1030","Closing the Velocity Gap: AI & Healthcare Adoption – Roche","PLUG-IN TALKS","EN"),
(3,"0930","1030","Data, Governance, and Technology as Key Ingredients – Damm","XPRO TALKS","ES"),
(3,"0930","1100","Creating a Real Product with AI: Vibe Coding – Midudev","FOCUS LAB","ES"),
(3,"0930","1100","Talent and Disability: Breaking Barriers in AI Era","FRONTIER LAB","ES"),
(3,"0930","1100","Build Your First AI Model in 60 Min – Edge Impulse","XPRO LAB","EN"),
(3,"0945","1015","Building Complex Code-Defined AI Agents for Robotic Actions","ROBOTICS","CA"),
(3,"1000","1030","Quantum Sensors: The Technology That Measures the Impossible","VISIONARY STAGE","ES"),
(3,"1000","1030","Another Bot? No: An Architecture – Banco de España","XPRO STAGE","ES"),
(3,"1000","1100","Immersive Interview Experience: Live a Real Interview","SKILLS HUB","ES"),
(3,"1030","1100","Learning at the Speed of AI – Linux Foundation","VISIONARY STAGE","EN"),
(3,"1030","1100","From Measurement to Intelligence: Server-Side Strategy – MediaMarkt","XPRO STAGE","ES"),
(3,"1030","1130","Blanca Miguel Casanovas","MEETUP AREA","ES"),
(3,"1030","1100","Do's & Don'ts for Your Indie Game","GAMING","EN"),
(3,"1030","1130","The AI-Ready Workforce: Who Thrives, Who Survives?","XPRO TALKS","EN"),
(3,"1030","1130","José A. Rodríguez Serrano","HOTSPOT TALKS","EN"),
(3,"1030","1130","Women Influencing and Leading the Forefront of Tech","PLUG-IN TALKS","CA"),
(3,"1100","1130","From Idea to Product: Rethinking How We Build in the Age of AI","XPRO STAGE","EN"),
(3,"1100","1130","Cristina Vázquez Pelegrí","VISIONARY STAGE","ES"),
(3,"1115","1145","Joan Marc Samó Rojas","ROBOTICS","EN"),
(3,"1115","1245","Casandra Vicente","FOCUS LAB","ES"),
(3,"1115","1245","Giving AI Agents Superpowers: Connecting Them to the Real World","FRONTIER LAB","EN"),
(3,"1115","1245","The Red Team: The Telco AI Prompt Engineering Challenge","XPRO LAB","EN"),
(3,"1130","1230","Spencer Kelly (Moderator) – Panel","VISIONARY STAGE","EN"),
(3,"1130","1230","Isabel Rodríguez Oliva","MEETUP AREA","ES"),
(3,"1130","1230","PLAI – Data and AI Democratization at Sanofi","HOTSPOT TALKS","EN"),
(3,"1130","1230","Women Talent in the Tech Sector","BARCELONA","CA"),
(3,"1130","1230","Decode Yourself: Discover Your DISC Style","SKILLS HUB","ES"),
(3,"1200","1230","Everyday Objects as Game Mechanics","GAMING","EN"),
(3,"1230","1300","From Data to Impact: How AI @Roche Is Rewriting Healthcare","VISIONARY STAGE","EN"),
(3,"1230","1300","Engineering in the Age of AI – Why Fundamentals Matter","XPRO STAGE","EN"),
(3,"1230","1330","Donestic Community: Inspiration, Connections","MEETUP AREA","CA"),
(3,"1230","1330","A Holistic View of Artificial Intelligence","HOTSPOT TALKS","EN"),
(3,"1230","1330","Pere Alcoberro Turu","PLUG-IN TALKS","EN"),
(3,"1230","1330","Marta Gascón Corella","XPRO TALKS","ES"),
(3,"1230","1330","Discover In-Demand Profiles and Connect with Companies","BARCELONA","CA"),
(3,"1245","1315","The New Era of Social Robotics","ROBOTICS","EN"),
(3,"1300","1330","Marietje Schaake","XPRO STAGE","EN"),
(3,"1300","1430","Timothy Serewicz – Workshop","XPRO LAB","EN"),
(3,"1300","1430","Cristina Fernández","FOCUS LAB","ES"),
(3,"1300","1430","More Than a Hack – Final Pitching","FRONTIER LAB","EN"),
(3,"1300","1400","Back to Your Future: Get Ready for the Tech Market","SKILLS HUB","ES"),
(3,"1330","1400","Carlos Milán Figueredo","XPRO STAGE","EN"),
(3,"1330","1430","Fireside Chat: Kate Darling","VISIONARY STAGE","EN"),
(3,"1330","1430","Connect to Elevate: Volunteering Tech Skills for Impact","MEETUP AREA","EN"),
(3,"1330","1400","Why Players Don't Quit: Designing Engaging Difficulty","GAMING","EN"),
(3,"1330","1430","Managing Transformation: AI Reshapes Health Organizations","BARCELONA","EN"),
(3,"1330","1430","AI Transfer: From Lab to the Global Market","HOTSPOT TALKS","CA"),
(3,"1330","1430","The Evolution of the Developer's Role in the Era of Agents","PLUG-IN TALKS","ES"),
(3,"1330","1430","From Data Stack Challenges to AI-Ready Scale","XPRO TALKS","EN"),
(3,"1400","1430","Sara García Alonso","XPRO STAGE","ES"),
(3,"1500","1600","Joost van Dreunen","VISIONARY STAGE","EN"),
(3,"1500","1515","From Code to Capability: Unlocking New App Experiences","XPRO STAGE","EN"),
(3,"1500","1600","AI at the Edge: Meetup with Qualcomm, Edge Impulse & Arduino","MEETUP AREA","EN"),
(3,"1500","1530","Robot Autonomy in an Unstructured World","ROBOTICS","EN"),
(3,"1500","1630","Boosting Productivity with AI: A Hands-On Workshop","FOCUS LAB","EN"),
(3,"1500","1630","Hack Your Brain: Designing Bias-Free Technology","FRONTIER LAB","CA"),
(3,"1500","1815","The Quantum Threat: Transitioning to Post-Quantum Security","XPRO LAB","EN"),
(3,"1500","1600","Hack Your CV: Key Tips to Beat AI Filters","SKILLS HUB","ES"),
(3,"1515","1530","Authentication for the AI Era: Build Passwordless Security","XPRO STAGE","EN"),
(3,"1530","1545","Pushpendra Singh","XPRO STAGE","EN"),
(3,"1530","1630","Between Diapers and Deploys: Mothers Compiling the Future","HOTSPOT TALKS","ES"),
(3,"1530","1630","Fernando Vilariño Freire (Moderator)","PLUG-IN TALKS","ES"),
(3,"1530","1630","How AI Is Redefining the Software Lifecycle","XPRO TALKS","ES"),
(3,"1530","1630","Certified Training to Boost Talent","BARCELONA","CA"),
(3,"1545","1600","Level Up Your Apps: Agent Protocols to Real-World API","XPRO STAGE","EN"),
(3,"1545","1615","Enrique Lis Mesquida","GAMING","EN"),
(3,"1600","1700","87-Minutes Game: How AI Is Boosting Barça's Edge","VISIONARY STAGE","EN"),
(3,"1600","1645","Open Gateway Hackathon: Live Finals","XPRO STAGE","EN"),
(3,"1600","1700","Guillermo Prieto","MEETUP AREA","EN"),
(3,"1615","1715","CTO Leadership Lab: Communicate, Attract, Retain Tech Talent","SKILLS HUB","ES"),
(3,"1630","1700","Jesus Angel Bravo Duque","ROBOTICS","ES"),
(3,"1630","1730","José Carlos Ruíz","HOTSPOT TALKS","ES"),
(3,"1630","1730","How Public Institutions Shape Real Opportunities","XPRO TALKS","EN"),
(3,"1630","1730","Fernando Rodriguez","BARCELONA","EN"),
(3,"1630","1730","AI with Human Values: Ethical and Cultural Challenge","PLUG-IN TALKS","ES"),
(3,"1645","1700","Secure Your MCP Servers with OAuth, JWT, SPIFFE","XPRO STAGE","EN"),
(3,"1645","1815","Creative Coding Workshop","FOCUS LAB","EN"),
(3,"1645","1815","Prototype to Product: Scaling Edge AI","FRONTIER LAB","EN"),
(3,"1645","1815","Building AI Agents with Spring AI","XPRO LAB","EN"),
(3,"1700","1720","Network Abstraction: Programmable Networks for the AI Era","XPRO STAGE","EN"),
(3,"1700","1800","The New Era of Talent Access","MEETUP AREA","EN"),
(3,"1715","1745","Xavier Teixe Ramon","GAMING","EN"),
(3,"1720","1735","From Zero to Network-Aware AI in 15 Min","XPRO STAGE","EN"),
(3,"1730","1830","The New Travel Project: A Value Chain","HOTSPOT TALKS","EN"),
(3,"1730","1830","Iratxe Kaltzakorta","PLUG-IN TALKS","ES"),
(3,"1730","1830","Conversational Capital: Hidden Asset Powering Agentic AI","XPRO TALKS","EN"),
(3,"1730","1830","Open Data Ecosystem in Spain","BARCELONA","ES"),
(3,"1730","1830","Hack Your Interview: Face Interviews with Confidence","SKILLS HUB","ES"),
(3,"1735","1800","Hackathon Awards","XPRO STAGE","EN"),
(3,"1745","1755","GSMA – Coming Soon","XPRO STAGE","EN"),
(3,"1800","1830","Real Time Powerful Visuals for Live Music","VISIONARY STAGE","EN"),
(3,"1800","1830","DSM-Firmenich Powered by AI","XPRO STAGE","EN"),
(3,"1800","1900","Julieta Zalduendo","MEETUP AREA","EN"),
(3,"1830","2030","Talent Arena Party by Estrella Damm","VISIONARY STAGE","EN"),

# ══════════════════ MARCH 4 ══════════════════
(4,"0930","1000","Design a Career You Love in Times of Ultra-Competitiveness","VISIONARY STAGE","ES"),
(4,"0930","1000","Confessions of a Vibecoding Engineer – Nicolás Grenié","XPRO STAGE","EN"),
(4,"0930","1030","Farbod Tavakkoli","MEETUP AREA","EN"),
(4,"0930","1030","How Nestlé Drives Innovation Through XR","HOTSPOT TALKS","EN"),
(4,"0930","1030","Innovation in Action: Reinventing and Accelerating Innovation","PLUG-IN TALKS","EN"),
(4,"0930","1030","HR Exchange: Inspirational Keynote","BARCELONA","ES"),
(4,"0930","1030","The Future of the Edge AI and Physical AI","XPRO TALKS","EN"),
(4,"0930","1100","Alexia Salavrakos","FOCUS LAB","EN"),
(4,"0930","1100","Amparo Canaveras – AI Agent for Energy Saving in 5G","XPRO LAB","EN"),
(4,"0930","1100","From Frustrait-ion to Async Mastery: Become a Rust Trait","FRONTIER LAB","EN"),
(4,"0945","1015","Javi Hernández Braña","ROBOTICS","EN"),
(4,"1000","1030","Francesco Fabbri","XPRO STAGE","EN"),
(4,"1000","1030","Alberto Valiña Lema","VISIONARY STAGE","ES"),
(4,"1000","1100","Back to Your Future: Get Ready for the Tech Market","SKILLS HUB","ES"),
(4,"1030","1100","Tim Roedenbroker – Creative Coding to Demystify Technology","VISIONARY STAGE","EN"),
(4,"1030","1100","Gaming Session","GAMING","ES"),
(4,"1030","1130","Turning Silos into Synergy Through InnerSource","XPRO TALKS","EN"),
(4,"1030","1130","Beyond the Code: Skills That Drive Innovation","PLUG-IN TALKS","EN"),
(4,"1030","1130","Challenge Next Arena Project Presentations","BARCELONA","EN"),
(4,"1030","1035","Next HR – Welcome","HOTSPOT TALKS","ES"),
(4,"1035","1105","Next HR – Talent Magnetism: Employer Branding","HOTSPOT TALKS","ES"),
(4,"1100","1130","Marcia Villalba Monné","XPRO STAGE","ES"),
(4,"1100","1130","From 'Promstitution' to Impact: Devs Stay Essential","VISIONARY STAGE","ES"),
(4,"1105","1130","Next HR – Market Intelligence for HR","HOTSPOT TALKS","ES"),
(4,"1115","1145","Sergi de las Muelas","ROBOTICS","ES"),
(4,"1115","1245","Armando Salvador","FOCUS LAB","ES"),
(4,"1115","1245","Computer Vision with Arduino UNO Q: Edge AI to VLMs","XPRO LAB","EN"),
(4,"1115","1245","How to Train Your Robot","FRONTIER LAB","ES"),
(4,"1130","1200","From Adoption to Impact: Adoption Accelerates AI","VISIONARY STAGE","EN"),
(4,"1130","1230","Amparo Canaveras","MEETUP AREA","EN"),
(4,"1130","1230","A More Accessible and Democratic Open-Source AI","PLUG-IN TALKS","ES"),
(4,"1130","1230","Challenge Next Arena Presentations (cont.)","BARCELONA","EN"),
(4,"1130","1200","Next HR – Smart Hiring: AI-Driven Automation","HOTSPOT TALKS","ES"),
(4,"1130","1230","Scaling Science at Large Facilities: ALBA and BSC","XPRO TALKS","EN"),
(4,"1130","1230","Immersive Interview Experience","SKILLS HUB","ES"),
(4,"1200","1230","The Future of Enterprise AI Governance","VISIONARY STAGE","EN"),
(4,"1200","1300","20,000 Blunders in Tech Leadership","XPRO STAGE","ES"),
(4,"1200","1230","Gaming Session 2","GAMING","ES"),
(4,"1200","1220","Next HR – Rethinking Access to Digital Talent","HOTSPOT TALKS","EN"),
(4,"1220","1300","Next HR – Grow to Stay: Developing Digital Talent","HOTSPOT TALKS","ES"),
(4,"1230","1300","Arnau Oncins Rodriguez","VISIONARY STAGE","EN"),
(4,"1230","1330","Tapas & Observability: Connect, Chat, Enjoy","MEETUP AREA","EN"),
(4,"1230","1330","Plug-in Talks Session","PLUG-IN TALKS","ES"),
(4,"1230","1330","From Zero to Hero: Cybersecurity with Cisco","XPRO TALKS","ES"),
(4,"1230","1330","Ajuntament de Barcelona – Coming Soon","BARCELONA","ES"),
(4,"1245","1315","PUCRA: University Students in High-Level Robotics","ROBOTICS","EN"),
(4,"1300","1330","Invisible Technology","VISIONARY STAGE","ES"),
(4,"1300","1330","AI Lift-Off: Escaping Prototype Gravity to Production","XPRO STAGE","EN"),
(4,"1300","1325","Gabriel Luciano Pietrafesa","HOTSPOT TALKS","ES"),
(4,"1300","1430","Miquel Serracanta","FOCUS LAB","ES"),
(4,"1300","1430","Build Your Own AI Agent – From Theory to Practice – CaixaBank","FRONTIER LAB","ES"),
(4,"1300","1430","Christian Ibars Casas","XPRO LAB","EN"),
(4,"1300","1400","Hack Your CV: Beat AI Filters","SKILLS HUB","ES"),
(4,"1325","1330","Next HR – Closing","HOTSPOT TALKS","ES"),
(4,"1330","1400","Jordina Torrents Barrena","XPRO STAGE","EN"),
(4,"1330","1400","Xabier Morales Ferez","VISIONARY STAGE","EN"),
(4,"1330","1430","Lawrence Freeman","MEETUP AREA","EN"),
(4,"1330","1400","Gaming Session 3","GAMING","ES"),
(4,"1330","1430","AI with Purpose: Ethics That Transform Talent Management","HOTSPOT TALKS","EN"),
(4,"1330","1430","Building the AI Generation: Empowering Research Talent","PLUG-IN TALKS","ES"),
(4,"1330","1430","Responsible and Secure AI: Protect Your Org in GenAI Era","BARCELONA","EN"),
(4,"1400","1430","Jose Carlos del Sol","VISIONARY STAGE","EN"),
(4,"1400","1430","Anastasia Kondratrieva","XPRO STAGE","EN"),
(4,"1500","1530","How to Survive an AI That's Trying to Replace You","VISIONARY STAGE","ES"),
(4,"1500","1530","Isidre Royo Bonnin","XPRO STAGE","EN"),
(4,"1500","1600","Meetup with Eurofirms","MEETUP AREA","EN"),
(4,"1500","1530","Beatriz Osorio Abraham","ROBOTICS","ES"),
(4,"1500","1630","Javier Ramos Panduro","FRONTIER LAB","ES"),
(4,"1500","1630","Sovereign AI & FinOps: Cloud Control into Competitive Advantage","XPRO LAB","EN"),
(4,"1500","1815","Farbod Tavakkoli – Workshop","FOCUS LAB","EN"),
(4,"1500","1600","CTO Leadership Lab: Communicate, Attract, Retain","SKILLS HUB","ES"),
(4,"1530","1600","From Devices to Digital: Building Connected Experiences","VISIONARY STAGE","EN"),
(4,"1530","1630","Rebuild AI: GenAI for Business (Live Demos)","PLUG-IN TALKS","CA"),
(4,"1530","1630","Without Talent There Is No Technology: Catalonia's Digital","BARCELONA","EN"),
(4,"1530","1630","AI and Central Banking","HOTSPOT TALKS","ES"),
(4,"1530","1630","SEDIA – Coming Soon","XPRO TALKS","ES"),
(4,"1545","1615","How to Live 150 Years Through Gaming Biotech","GAMING","ES"),
(4,"1600","1630","Albert Sampietro Ventosa","XPRO STAGE","EN"),
(4,"1600","1630","Michael Cleavinger","VISIONARY STAGE","EN"),
(4,"1600","1700","Meetup Session","MEETUP AREA","EN"),
(4,"1615","1715","Hack Your Interview: Confidence and Authenticity","SKILLS HUB","ES"),
(4,"1630","1700","Francesc Pla Prats","VISIONARY STAGE","EN"),
(4,"1630","1700","Alexander Holbach","XPRO STAGE","EN"),
(4,"1630","1700","Jesus Angel Bravo Duque","ROBOTICS","ES"),
(4,"1630","1730","From Digital to Agentic (A Realistic Approximation)","HOTSPOT TALKS","EN"),
(4,"1630","1730","Carlos Vizoso Raya","PLUG-IN TALKS","ES"),
(4,"1630","1730","Our AI Agents Are Finally in Production — And Now What?","XPRO TALKS","EN"),
(4,"1630","1730","Talent, Innovation, and Opportunities in Emerging Tech","BARCELONA","ES"),
(4,"1645","1815","Integrating Accessibility in Video Games","FRONTIER LAB","ES"),
(4,"1645","1815","Lawrence Freeman – Workshop","XPRO LAB","EN"),
(4,"1700","1730","How Playgami Powers the Next Generation of Games","XPRO STAGE","EN"),
(4,"1700","1730","Oiane Etxebarria Tobias","VISIONARY STAGE","ES"),
(4,"1700","1800","Sharing to Grow: How Mentorship Multiplies Talent","MEETUP AREA","ES"),
(4,"1715","1745","MAGAS – Coming Soon","GAMING","ES"),
(4,"1730","1800","Francisco Herrero","XPRO STAGE","EN"),
(4,"1730","1800","Magamers Award Ceremony","VISIONARY STAGE","EN"),
(4,"1730","1830","10 Lessons I Would Have Said to Me 25 Years Ago","HOTSPOT TALKS","EN"),
(4,"1730","1830","Closing: Humans in the Loop Hackathon","PLUG-IN TALKS","ES"),
(4,"1730","1830","We Are Superhuman","XPRO TALKS","EN"),
(4,"1730","1830","Decode Yourself: Discover Your DISC Style","SKILLS HUB","ES"),
(4,"1800","1830","Closing Ceremony","VISIONARY STAGE","EN"),
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

events_str = "\n".join(ev(*s) for s in ALL)

ics = f"""\
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MWC Talent Arena Full//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:MWC Talent Arena (ALL sessions)
X-WR-TIMEZONE:{TZ}
{VTIMEZONE}
{events_str}
END:VCALENDAR"""

CALENDAR_FILE.write_text(ics, encoding="utf-8")

# Stats
from collections import Counter
stage_count = Counter(s[4] for s in ALL)
day3 = sum(1 for s in ALL if s[0]==3)
day4 = sum(1 for s in ALL if s[0]==4)

print(f"✅ Calendar file: {CALENDAR_FILE}")
print(f"📅 {len(ALL)} total events ({day3} March 3 + {day4} March 4)")
print(f"\nBy stage:")
for stage, count in stage_count.most_common():
    emoji = {"XPRO STAGE":"🟡","XPRO LAB":"🟡","XPRO TALKS":"🟡","VISIONARY STAGE":"🟣",
             "HOTSPOT TALKS":"🔵","PLUG-IN TALKS":"🟠","FOCUS LAB":"🟢","FRONTIER LAB":"🟢",
             "MEETUP AREA":"⚪","BARCELONA":"🔴","SKILLS HUB":"⚫","ROBOTICS":"🤖","GAMING":"🎮"}.get(stage,"📌")
    print(f"  {emoji} {stage}: {count}")

print("\nOpening in calendar app...")
subprocess.run(["open", str(CALENDAR_FILE)])
