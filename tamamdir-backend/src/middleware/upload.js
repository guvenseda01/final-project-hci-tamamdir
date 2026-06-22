const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

function makeStorage(subfolder) {
  const dest = path.resolve(__dirname, `../../uploads/${subfolder}`);

  // Ensure the destination directory exists. This matters when the
  // "uploads" folder lives on a freshly attached Railway Volume, which
  // starts out completely empty — multer's diskStorage will not create
  // missing directories on its own and will throw ENOENT otherwise.
  fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: dest,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const avatarUpload = multer({
  storage: makeStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const serviceImageUpload = multer({
  storage: makeStorage('services'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const portfolioUpload = multer({
  storage: makeStorage('portfolios'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { avatarUpload, serviceImageUpload, portfolioUpload };