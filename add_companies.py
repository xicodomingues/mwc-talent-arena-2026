#!/usr/bin/env python3
"""Add 'companies' field to each session in mwc_sessions_clean.json."""

import json
import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(SCRIPT_DIR, "mwc_sessions_clean.json")

# Manual company overrides: (speaker_name, session_index) -> company
MANUAL = {
    ("Pablo Jarillo-Herrero", 1): "MIT",
    ("Guillermo Prieto", 5): "CaixaBank Tech",
    ("Albert Del Baño", 5): "CaixaBank Tech",
    ("Adriana López-Doriga Guerra", 5): "Nennisiwok",
    ("Miguel Ángel Duran (MiduDev)", 6): "MiduDev",
    ("José Luis Crespo", 10): "Quantum Fracture",
    ("Casandra Vicente", 23): "ESIC University",
    ("Tim-Berners Lee", 26): "W3C",
    ("Juan Aguila", 28): "HP",
    ("Tara Chklovski", 36): "Technovation",
    ("Sara García Alonso", 56): "CNIO",
    ("Anna Cramling", 57): "Independent",
    ("Albert Mundet", 73): "FC Barcelona",
    ("Nick Venezia", 89): "Centillion",
    ("Iratxe Kaltzakorta", 91): "Agile Spain",
    ("Hans van Dam", 92): "Conversation Design Institute",
    ("Hackathon Awards", 95): "",
    ("VJ PRIZMA", 97): "",
    ("DJ BULMA BEAT", 100): "",
    ("Adri Carvajal", 101): "Independent",
    ("Amparo Canaveras", 109): "AWS",
    ("Tim Roedenbroker", 115): "TRCC",
    ("Magas", 116): "Magamers",
    ("Ana Gamito", 117): "AXA Group",
    ("Marcia Villalba Monné", 122): "AWS",
    ("Armando Salvador", 126): "EAE Business School",
    ("Asier Arranz", 128): "NVIDIA",
    ("Jesús Ángel Bravo Duque", 128): "Bravo Robots",
    ("Magas", 139): "Magamers",
    ("Humbert Ruiz (Moderator)", 145): "Barcelona Activa",
    ("Xavier Massa", 145): "Cisco",
    ("Maria Barragan", 145): "SIRT",
    ("Paola Arrabal Agüera", 145): "INCIBE",
    ("Elena Villalba Aguilera", 146): "PUCRA",
    ("Santiago Pallarès Ocampo", 146): "PUCRA",
    ("Marc Redolad Ramos", 146): "PUCRA",
    ("Miquel Serracanta", 150): "EAE Business School",
    ("CC Chong", 152): "Keysight Technologies",
    ("Xabier Morales Ferez", 156): "Sanofi",
    ("Magas", 158): "Magamers",
    ("Ismael Ordaz Reyes", 159): "SLNG.ai",
    ("Anna Golsa", 160): "Eurofirms",
    ("Eduard Rosicart", 175): "EAE Business School",
    ("Karim Casado", 178): "Somni Game Studios",
    ("Ana Belén Arzo Cabrera", 189): "Diputación de Castellón",
    ("Vicente Pallarés Renau", 189): "Diputación de Castellón",
    ("Nerea Safont Horma", 189): "XarxaTec",
    ("Cristian Suárez Henríquez", 190): "Por Talento Digital",
    ("Gemma Guiu", 190): "Deia School",
    ("Oriol Vicente", 190): "Deia School",
    ("MAGAMERS 2026", 196): "",
    ("Montserrat Guardia Güell (moderator)", 198): "UPC",
    ("María Jesús Martín", 198): "SEDIA",
    ("Laia Ferrao (Moderator)", 199): "dsm-firmenich",
    ("Jordi Mollà", 202): "Independent",
    ("José Velasco", 202): "PLIA",
    ("Sergio Martínez Campos", 205): "Hispano Suiza",
    ("Juan Fernández", 205): "Hispano Suiza",
    ("Pipo Serrano", 205): "Independent",
    # Sessions with speakers in name field
    ("Ainoa Irurre, Europe Talent Attraction Vice President  at Schneider Electric", 118): "Schneider Electric",
    ("Laura Sancho, Director IT Iberia & Project Management Officer at Schneider Electric", 118): "Schneider Electric",
    ("Yolanda Triviño, CEO Institute for Futures Futures at Institute for Futures Futures", 118): "Institute for Futures Futures",
    ("Joana Barbany, Technology Business Development Director at Michael Page", 118): "Michael Page",
    # Fix messy extractions
    ("Albert Viñas Ferrer", 8): "SEIDOR",
    ("Josefa Vázquez López", 8): "Ajuntament de Barcelona",
    ("Andreu Castellano", 8): "Grifols",
    ("Xavier Xicoy Crusellas", 8): "Grupo SIFU",
    ("Gemma Sala ", 8): "Eurofirms Foundation",
    ("Andreea Lungulescu", 17): "Talent Crunch",
    ("Alex Lobaco Poyatos", 79): "Consorci per a la Formació Contínua de Catalunya",
    ("Miquel Carrion Molina", 79): "SOC Catalunya",
    ("Gaizka Cañellas Ayerdi", 79): "Ironhack",
    ("Fernando Garrido Ferradanes", 79): "EOI",
    ("Ruth Gumbau", 52): "Barcelona Health Hub",
    ("Jordi Guitart", 52): "M47 AI",
    ("Khalid Bouziane", 52): "ASHO",
    ("Cristina Morgan", 52): "Ferrer",
    ("Elena González-Blanco García", 37): "Microsoft",
    ("Antonio Serrano Acitores", 37): "Universidad Rey Juan Carlos",
    ("Cristina Casado Cañeque", 37): "Fundación Formación y Futuro",
    ("Antonio Serrano Acitores", 61): "Universidad Rey Juan Carlos",
    ("Xavier Jofre Mestre", 61): "Fundación Formación y Futuro",
    ("Matilde Martínez Casanovas", 61): "IGEMA Business School",
    ("Daniel González", 105): "Worldline",
    ("Jose Maria Lopez Granados", 105): "Worldline",
    ("Santi Ristol Jorba", 105): "Worldline",
    ("Joan Vicent Orenga Serisuelo", 105): "Worldline",
    ("Amaia Zarranz", 144): "CaixaBank Tech",
    ("Maria Engracia Guillamon Bagan", 144): "CaixaBank",
    ("Claudia Platel", 144): "CaixaBank",
    ("Lourdes Mercadal", 144): "CaixaBank Tech",
}

# Sessions with no speakers but identifiable company from title/context
TITLE_COMPANIES = {
    30: "Sanofi",
    45: "42 Barcelona",
    49: "MIT Media Lab",
    51: "43 Studios",
    97: "VJ PRIZMA",
    100: "Estrella Damm",
    104: "Nestlé",
    127: "Arduino",
    196: "Magamers",
}

# After extraction: pick the most recognizable company for each session
# Map session index -> preferred primary company
PRIMARY_COMPANY = {
    5: "CaixaBank Tech",
    8: "SEIDOR",
    17: "LinkedIn",
    37: "Microsoft",
    52: "Ferrer",
    61: "Universidad Rey Juan Carlos",
    79: "Ironhack",
    105: "Worldline",
    118: "Schneider Electric",
    128: "NVIDIA",
    144: "CaixaBank",
    145: "Cisco",
    189: "XarxaTec",
    198: "BSC-CNS",
    199: "dsm-firmenich",
    202: "Grupo iZen",
    205: "Hispano Suiza",
}


def extract_company(name, role, session_idx):
    """Extract company from speaker name/role."""
    # Check manual overrides first
    key = (name, session_idx)
    if key in MANUAL:
        return MANUAL[key]

    text = role or ""

    # Pattern: 'at Company' (with or without space after 'at')
    m = re.search(r'\bat\s*([A-Z].+?)(?:\s*\(.*\))?$', text)
    if m:
        return m.group(1).strip().rstrip(".")

    # Pattern: 'en Company'
    m = re.search(r'\ben\s+([A-Z].+?)(?:\s*\(.*\))?$', text)
    if m:
        return m.group(1).strip()

    # Pattern: 'Founder/CEO of Company'
    m = re.search(r'\bof\s+(.+?)(?:\s*\(.*\))?$', text)
    if m:
        return m.group(1).strip()

    # Pattern: 'Company – Role'
    if " – " in text:
        parts = [p.strip() for p in text.split(" – ", 1)]
        role_words = [
            "director", "head", "manager", "lead", "ceo", "cto", "founder",
            "engineer", "architect", "scientist", "coordinator", "officer",
            "president", "producer", "journalist", "coordinador", "deputy",
            "subdirector", "consultant", "technical", "sr.", "senior",
            "advisor", "co-founder", "vp", "vice",
        ]
        p0_is_role = any(w in parts[0].lower() for w in role_words)
        p1_is_role = any(w in parts[1].lower() for w in role_words)
        if not p0_is_role and p1_is_role:
            return parts[0]
        if p0_is_role and not p1_is_role:
            return parts[1]

    # Pattern: 'Company - Role'
    if " - " in text:
        parts = [p.strip() for p in text.split(" - ", 1)]
        role_words = [
            "director", "head", "manager", "lead", "ceo", "cto", "founder",
            "president", "master", "coordinador", "presidenta",
        ]
        p0_is_role = any(w in parts[0].lower() for w in role_words)
        if not p0_is_role:
            return parts[0]

    # Pattern: 'Role, Company' where Company has capital
    m = re.search(r',\s+([A-Z][A-Za-z\s&]+)$', text)
    if m:
        candidate = m.group(1).strip()
        skip = ["and", "the", "spanish", "reserve"]
        if not any(w in candidate.lower() for w in skip):
            return candidate

    # Check name field for 'at Company'
    if " at " in name:
        m = re.search(r'\bat\s+(.+)$', name)
        if m:
            return m.group(1).strip()

    return ""


def main():
    with open(INPUT) as f:
        data = json.load(f)

    for i, s in enumerate(data):
        companies = []
        for sp in s.get("speakers", []):
            c = extract_company(sp["name"], sp.get("role", ""), i)
            if c:
                companies.append(c)
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for c in companies:
            if c and c not in seen:
                seen.add(c)
                unique.append(c)
        s["companies"] = unique
        # Set primary company (most recognizable one)
        if i in PRIMARY_COMPANY:
            s["company"] = PRIMARY_COMPANY[i]
        elif unique:
            s["company"] = unique[0]
        else:
            s["company"] = TITLE_COMPANIES.get(i, "")

    with open(INPUT, "w") as f:
        json.dump(data, f, indent=1, ensure_ascii=False)

    # Stats
    with_co = sum(1 for s in data if s["companies"])
    without = sum(1 for s in data if not s["companies"])
    print(f"Updated {len(data)} sessions: {with_co} with companies, {without} without")

    # Show a few samples
    for s in data[:5]:
        print(f"  {s['title'][:50]} -> {s['companies']}")


if __name__ == "__main__":
    main()
