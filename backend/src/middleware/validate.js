import { z } from 'zod';
import logger from '../utils/logger.js';

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        logger.warn('Validation Failed', {
            errors: err.issues || err.errors,
            body: req.body
        });

        const issue = err.issues?.[0] || err.errors?.[0];

        return res.status(400).json({
            error: issue ? issue.message : 'Validation failed',
            field: issue ? issue.path?.[0] : undefined,
            status: 400
        });
    }
};

export default validate;
