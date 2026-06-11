export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { amount, phone_number, mode, pseudo } = req.body;
  const FEDA_KEY = process.env.FEDA_KEY;
  const FRAIS_POURCENT = 3;

  if (!amount || amount < 1000) return res.status(400).json({ message: 'Montant invalide' });
  
  const frais = Math.ceil(amount * FRAIS_POURCENT / 100);
  const montantNet = amount - frais;
  if (montantNet < 500) return res.status(400).json({ message: 'Solde trop faible après frais' });

  try {
    const fedaRes = await fetch('https://api.fedapay.com/v1/payouts', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + FEDA_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: montantNet,
        currency: 'XOF',
        customer: { phone_number },
        mode: mode,
        description: `Retrait Taches229 pour ${pseudo} - Net: ${montantNet}`
      })
    });
    const data = await fedaRes.json();
    if (fedaRes.ok) return res.status(200).json({ success: true, message: `${montantNet} FCFA envoyé`, net: montantNet });
    else return res.status(400).json({ success: false, message: data.message || 'Erreur FedaPay' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}
