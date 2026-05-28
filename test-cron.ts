require('dotenv').config({path:'.env.local'});
import { processOutreachQueue } from './src/lib/outreach/engine';
processOutreachQueue().then(console.log).catch(console.error);
