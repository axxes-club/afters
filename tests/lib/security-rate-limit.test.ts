import {it,expect,vi} from 'vitest';
vi.mock('@/lib/prisma',()=>({prisma:{$queryRawUnsafe:async()=>{throw new Error('database unavailable')}}}));
import {checkRsvpRateLimit} from '@/lib/rate-limit';
it('fails closed when distributed rate-limit storage is unavailable',async()=>expect(await checkRsvpRateLimit('synthetic')).toBe(false));
