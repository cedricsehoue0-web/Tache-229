import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tache-229-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

export default async function handler(req, res) {
  const event = req.body;
  
  // On garde que les paiements réussis
  if (event.entity?.status !== 'approved') {
    return res.status(200).send('Pas un paiement');
  }

  const amount = event.entity.amount;
  const userId = event.entity.metadata?.userId;

  if (!userId || !amount) return res.status(400).send('Il manque userId ou montant');

  // Le 60/40 magique
  const adminCut = Math.floor(amount * 0.6);
  const userCut = amount - adminCut;

  await db.ref().update({
    [`users/${userId}/solde_cpx`]: admin.database.ServerValue.increment(userCut),
    [`admin_wallet/main/total_60`]: admin.database.ServerValue.increment(adminCut)
  });

  res.status(200).send('60/40 OK');
}
