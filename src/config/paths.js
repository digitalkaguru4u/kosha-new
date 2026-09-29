import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const BACKEND_ROOT = path.resolve(here, '../..');
export const UPLOAD_DIR = path.join(BACKEND_ROOT, 'uploads');
export const FRONTEND_DIST = path.resolve(BACKEND_ROOT, '../frontend/dist');
