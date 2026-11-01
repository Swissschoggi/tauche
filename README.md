# Tauche - Dive Logbook & Telemetry Analytics Suite

[![Live Demo](https://img.shields.io/badge/Live%20Demo-tauche.onrender.com-38bdf8?style=for-the-badge&logo=render&logoColor=white)](https://tauche.onrender.com)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.6-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)

**Tauche** *(Swiss German for "diving")* is a full-stack web app for logging, tracking, and overanalyzing your scuba dives. Because why let a perfectly good piece of paper do the job when you can build a whole web app about it and also selfhost it?

I partially vibecoded this thing due to time constraints and my general lack of patience for reading docs. If something breaks (and it will), feel free to yell at me via issues I'm always happy to learn what I (or AI lol) did wrong.

> **Live Demo**: [https://tauche.onrender.com](https://tauche.onrender.com)
>
> *Free tier stuff, so give it a good 30 seconds to wake up before judging the loading speed.*

---

## What It Does

###  Dive Logging
Every dive gets the full treatment date, location, depth, duration, water temp, visibility, weather, suit type, gas mix, starting/ending pressure, buddy, dive center, notes, GPS coordinates, and even which equipment you used.

###  Interactive Telemetry Timeline
An SVG dive profile thingy that shows your depth over time. Fancy curves. Definitely not just a line chart template I found on the internet.

###  Map View & Dive Sites
All your dives plotted on a map. Powered by OpenStreetMap because Google wanted money.

###  Photo Gallery & Marine Life Sightings
Upload photos per dive, tag them with marine species (54 species to choose from, or add custom ones for fun). The **Sightings Dashboard** aggregates everything thumbnails, counts, last seen dates, expandable photo strips, search, and sort. Custom tags won't get counted as species cause if you put your own name you apparently count as a fish.

###  Equipment Closet
Track your gear, set service intervals, mark things as needing maintenance. Because your BCD deserves better than "eh, probably fine." (speaking from experience)

###  Trip Planning
Full trip management with:
- Destinations & dates
- Daily itinerary with dive site planning
- Dive buddies (just names now, the fancy account-linking thing is dead)
- Budget tracking
- Pre-trip checklist (6 items, gear serviced, travel booked, etc.)
- Weather forecast integration
- Gear packing lists per trip per person

Also imports Surmai `.zip` files.

###  Certifications
Log your certs agency, level, date.

###  Analytics
Charts. Stats. Numbers.

###  Buddy System
Search and connect with other registered divers. Add them as buddies. Stalk their profiles.

###  Dive Sharing
Share a dive. Great for bragging to people who don't care.

###  Admin Dashboard
If you somehow get admin access, you can manage users. Exciting stuff.

###  Profile & Settings
The usual edit your name, email, change your profile picture. Settings has some toggles I forgot what they do.

---

##  Tech Stack

| Layer | What |
|---|---|
| Backend | Java 21, Spring Boot, JPA/Hibernate |
| Frontend | React 18, Vite, React Router |
| Database | PostgreSQL 15 |
| Auth | JWT + Spring Security |
| Maps | Leaflet / OpenStreetMap |
| Images | Local upload storage |
| Deployment | Docker |

---

## Local Development

Run it without Docker.

### Prerequisites

- **Java 21+**
- **Node.js 20+**
- **npm**
- A running **PostgreSQL** instance.

###  Backend

```bash
# start spring boot
./mvnw spring-boot:run
```

Port `8080` by default. Images land in `./uploads/`.

###  Frontend

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Then:

```bash
cd frontend
npm install
npm run dev
```

Should be on `http://localhost:5173`.

---

## Docker Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full production guide
(env vars, volumes, permissions, reverse proxy, backups, troubleshooting).

```bash
wget https://raw.githubusercontent.com/Swissschoggi/tauche/refs/heads/main/docker-compose.yml
wget https://raw.githubusercontent.com/Swissschoggi/tauche/refs/heads/main/.env.example
mv .env.example .env
# edit .env (JWT_SECRET, DB password, ...)
mkdir -p uploads && sudo chown -R 100:101 uploads
docker compose up -d
```

---

## CORS Config

Tauche parses allowed origins from an env variable:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.x:8989
```

---

##  Things That Probably Need Fixing

- The trips page still uses localStorage because the backend model is missing half the fields
- The mobile nav is held together with duct tape
- I'm sure there's more, be sure to let me know

---

## Project Structure

```
Tauche/
├── docker-compose.yml
├── Dockerfile
├── pom.xml
├── render.yaml
├── src/main/java/com/tauche/tauche/
│   ├── config/          # Security, CORS, JWT
│   ├── controller/      # REST endpoints
│   ├── dto/             # Response/request objects
│   ├── model/           # JPA entities
│   ├── repository/      # Database access
│   └── service/         # Business logic
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/         # API client (axios)
│   │   ├── components/  # Reusable bits
│   │   ├── pages/       # Every page is here
│   │   └── hooks/       # Custom hooks
│   └── public/
└── uploads/             # User images land here
```

---

## License

MIT, or whatever. Don't do anything illegal with my dive app.

---

*Built because logging dives on paper is apparently "vintage" and not "tedious."*
