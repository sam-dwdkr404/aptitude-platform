![React](https://img.shields.io/badge/Frontend-React-blue)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-darkgreen)
![Deployment](https://img.shields.io/badge/Deployed-Vercel%20%7C%20Render-black)


# OSCODE Aptitude Platform

Full-stack analytics-driven aptitude testing platform designed to simulate real placement assessments for engineering students.

The platform provides **weekly timed aptitude tests, performance analytics, and an administrative dashboard** to track participation, student progress, and placement readiness.

Developed for **OSCODE AGMRCET** to encourage consistent aptitude preparation and generate actionable insights for placement readiness.

---

## Live Demo

Frontend  
https://aptitude-platform.vercel.app  

Backend API  
https://apti-tester.onrender.com

---

## Real Platform Usage

Current platform statistics:

- Students onboarded: **107**
- Weekly tests conducted: **3**
- Total attempts recorded: **22**
- Weekly participation rate: **16%**
- Students flagged at risk: **41%**

The system provides **analytics-based insights** for monitoring student placement preparation progress.

---

## Key Features

### Student Features

- Secure signup and login  
- Weekly timed aptitude tests  
- 20-question structured test format  
- Instant score calculation after submission  
- Detailed answer explanations  
- Leaderboard displaying top performers  
- Mobile-friendly responsive interface  
- Preparation resources through Prep Hub  

### Admin Dashboard

The platform includes a **live administrative console** to manage aptitude testing operations.

Admin capabilities include:

- Add, edit, and delete aptitude questions  
- Manage centralized question bank  
- Assign questions week-wise  
- Monitor participation statistics  
- Track average score trends  
- View leaderboard insights  
- Identify low-performing students  
- Send reminders to inactive participants  
- Export reports for academic leadership  

### Analytics System

The platform generates **placement readiness insights**, including:

- Weekly participation tracking  
- Average score analysis  
- Total attempts per test  
- Top performer leaderboard  
- Live activity feed  
- At-risk student identification  
- Upcoming test scheduling  

These analytics help **placement coordinators and faculty evaluate preparation levels across batches.**

---

## Tech Stack

Frontend  
- React (Vite)  
- Tailwind CSS  

Backend  
- Node.js  
- Express.js  

Database  
- MongoDB Atlas  

Authentication  
- JWT-based authentication  
- Role-based access control (Admin / Student)

Deployment  
- Frontend: Vercel  
- Backend: Render  
- Database: MongoDB Atlas  

---

## System Architecture

```

Student / Admin
↓
React Frontend (Vercel)
↓
REST API Requests
↓
Node.js + Express Backend (Render)
↓
MongoDB Atlas Database

```

The architecture separates **frontend UI, backend logic, and database storage**, enabling scalable deployment and maintainability.

---

## Project Structure

```

aptitude-platform
│
├── client
│   ├── src
│   ├── components
│   ├── pages
│   └── services
│
├── server
│   ├── controllers
│   ├── routes
│   ├── models
│   └── middleware
│
└── README.md

```

---

## Local Development Setup

Clone the repository

```

git clone (https://github.com/your-username/aptitude-platform.git)

```

Install frontend dependencies

```

cd client
npm install
npm run dev

```

Install backend dependencies

```

cd server
npm install
node index.js

```

---

## Environment Variables

Frontend `.env`

```

VITE_API_BASE=(http://localhost:5000)

```

Backend `.env`

```

MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
PORT=5000

```

---

## Screenshots

Add screenshots of:

- Landing page  
- Student test interface  
- Leaderboard  
- Admin dashboard  
- Analytics panel  

---

## Future Improvements

- Email reminders for weekly tests  
- AI-generated aptitude questions  
- Advanced analytics dashboards  
- Company-specific aptitude practice modules  
- Rank history tracking  
- Adaptive difficulty testing  

---

## Author

**Samanvita Dharwadkar**

AI & ML Undergraduate  
Managing Director — OSCODE AGMRCET  

GitHub  
https://github.com/sam-dwdkr404  

Contact  
samanvitard@gmail.com  

---

## License

This project is developed for **educational and community initiatives under OSCODE AGMRCET**.
