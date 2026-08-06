const multer = require('multer');

const MAX_FILE_SIZE_MB = Number.parseInt(process.env.MAX_UPLOAD_MB || '500', 10);
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = `${MAX_FILE_SIZE_MB} MB`;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = { upload, MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL };
