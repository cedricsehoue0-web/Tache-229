import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
if (!global.firebaseApp) {
  global.firebaseApp = initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { cpm_amount, cpm_custom, cpm_result } = req.body;
  if (cpm_result !== '00') return res.status(200).send('OK');
  
  const montant = parseFloat(cpm_amount);
  const partAdmin = montant * 0.6;
  const partJoueur = montant * 0.4;
  
  await db.collection('admin_wallet').doc('main').update({
    total_60: FieldValue.increment(partAdmin)
  });
  await db.collection('users').doc(cpm_custom).set({
    solde_cpx: FieldValue.increment(partJoueur)
  }, { merge: true });
  
  res.status(200).send('OK');
}
