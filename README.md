# couple-schedule-web

#### 프로젝트 구조
```
couple-schedule-app/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   ├── env.js
│   │   │   └── cors.js
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Couple.js
│   │   │   └── Schedule.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── coupleController.js
│   │   │   └── scheduleController.js
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── coupleService.js
│   │   │   └── scheduleService.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── coupleRoutes.js
│   │   │   └── scheduleRoutes.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   └── validateMiddleware.js
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── response.js
│   │   │   └── logger.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   ├── .env
│   └── nodemon.json
│
├── frontend/ (선택)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── README.md
└── .gitignore
```

Node.js + express + MongoDB


