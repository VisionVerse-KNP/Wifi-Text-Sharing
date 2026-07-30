import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { fetchLinkPreview } from './linkPreview';

const previewLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many link preview requests. Please wait a moment.' },
});

export function createLinkPreviewRouter(): Router {
  const router = Router();

  router.get('/link-preview', previewLimiter, async (req, res) => {
    const url = typeof req.query.url === 'string' ? req.query.url : '';
    if (!url || url.length > 2000) {
      res.status(400).json({ error: 'Missing or invalid url.' });
      return;
    }

    try {
      const preview = await fetchLinkPreview(url);
      if (!preview) {
        res.status(422).json({ error: 'Could not generate a preview for this link.' });
        return;
      }
      res.json(preview);
    } catch {
      res.status(500).json({ error: 'Could not generate a preview for this link.' });
    }
  });

  return router;
}
