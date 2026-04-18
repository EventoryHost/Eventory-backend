import ShortLink from '../models/ShortLink.js';
import crypto from 'crypto';

const generateShortCode = async () => {
    // Generate a random 6 character alphanumeric string
    let code;
    let exists = true;
    while(exists) {
        code = crypto.randomBytes(4).toString('base64url').substring(0, 6);
        const link = await ShortLink.findOne({ shortCode: code });
        if(!link) exists = false;
    }
    return code;
};

export const createShortLink = async (req, res) => {
    try {
        const { originalUrl } = req.body;
        if (!originalUrl) {
            return res.status(400).json({ success: false, error: 'originalUrl is required' });
        }

        const shortCode = await generateShortCode();

        const shortLink = new ShortLink({
            shortCode,
            originalUrl
        });

        await shortLink.save();

        res.status(201).json({
            success: true,
            data: {
                shortCode,
                shortUrl: `${process.env.FRONTEND_URL || 'https://eventory.in'}/pay/${shortCode}`,
                originalUrl
            }
        });
    } catch (error) {
        console.error('Create short link error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

export const getShortLink = async (req, res) => {
    try {
        const { code } = req.params;
        const shortLink = await ShortLink.findOne({ shortCode: code });

        if (!shortLink) {
            return res.status(404).json({ success: false, error: 'Short link not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                originalUrl: shortLink.originalUrl
            }
        });
    } catch (error) {
        console.error('Get short link error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
