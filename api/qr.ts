import { VercelRequest, VercelResponse } from '@vercel/node';
import QRCode from 'qrcode';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ error: 'Data parameter is required' });
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(data as string, {
      margin: 1,
      width: 400,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400');
    res.status(200).json({ qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
