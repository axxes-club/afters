import {it,expect,vi} from 'vitest';
vi.mock('@/lib/auth/session',()=>({getUserId:async()=>null,currentUser:async()=>null}));
vi.mock('@/lib/prisma',()=>({prisma:{$queryRawUnsafe:async()=>{throw new Error('outage')},$transaction:async(f:(tx:unknown)=>unknown)=>f({$queryRaw:async()=>[],event:{findUnique:async()=>null}})}}));
vi.mock('@/lib/stripe',()=>({calculateFees:()=>({}),stripe:{}}));
import {POST} from '@/app/api/orders/route';
it('fails closed before allocating inventory when admission storage is unavailable',async()=>{
 const response=await POST(new Request('https://afters.am/api/orders',{method:'POST',body:JSON.stringify({eventId:'event',email:'buyer@example.test',guestName:'Buyer',items:[{ticketTierId:'tier',quantity:1}]})}));
 expect(response.status).toBe(429);
});
