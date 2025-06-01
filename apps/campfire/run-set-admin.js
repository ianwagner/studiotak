const admin = require('firebase-admin');
const serviceAccount = require('./tak-campfire-firebase-adminsdk-fbsvc-bc790ab612.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node run-set-admin.js <uid>');
  process.exit(1);
}

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Admin claim set for user: ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error setting admin claim:', error);
    process.exit(1);
  });