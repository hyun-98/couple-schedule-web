require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;

/** 로컬 개발 시 .env 없이도 동작하도록 기본값 사용 */
const DEFAULT_LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/couple_schedule';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_LOCAL_MONGODB_URI;

if (!process.env.MONGODB_URI) {
  console.warn(
    '[dev] MONGODB_URI가 설정되지 않아 로컬 기본 URI를 사용합니다:',
    DEFAULT_LOCAL_MONGODB_URI
  );
} else {
  console.log('[dev] MONGODB_URI:', MONGODB_URI);
}

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in environment');
  process.exit(1);
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, {
      /** 로컬에서 몽고 미기동 시 무한 대기 방지 */
      serverSelectionTimeoutMS: 8000,
    });
    console.log('MongoDB connected:', mongoose.connection.name);

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server (MongoDB 연결 실패?)', err.message);
    process.exit(1);
  }
}

start();
