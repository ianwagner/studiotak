const admin = require('firebase-admin');
const serviceAccount = require('./tak-campfire-firebase-adminsdk-fbsvc-bc790ab612.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'NG2Z0cPlICNpi1HTB0Hv9DKIte03'; // ← get from Firebase Auth user list

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Admin claim set for user: ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error setting admin claim:', error);
    process.exit(1);
  });