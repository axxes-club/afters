import {it,expect,vi,beforeEach} from 'vitest';
const state=vi.hoisted(()=>({events:[] as any[],claimed:new Set<string>(),send:vi.fn(),push:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{event:{findMany:async(args:any)=>args.where.startsAt.gte.getTime()<Date.now()+2*3600000?state.events:[]},notificationPreference:{findUnique:async()=>null},$queryRawUnsafe:async(_sql:string,key:string)=>{if(state.claimed.has(key))return [];state.claimed.add(key);return [{key}];}}}));
vi.mock('@/lib/push',()=>({notifyEventReminder:state.push}));
vi.mock('@/lib/email',()=>({sendEmail:state.send,generateEventReminderEmailHtml:()=>''}));
import {GET} from '@/app/api/cron/event-reminders/route';
beforeEach(()=>{state.claimed.clear();state.events=[];state.send.mockClear();state.push.mockClear();vi.unstubAllEnvs();});
it('disables reminder execution when cron authentication is unconfigured',async()=>{
 vi.stubEnv('CRON_SECRET','');
 expect((await GET(new Request('https://afters.am/api/cron/event-reminders'))).status).toBe(503);
});
it('dispatches an event reminder once across concurrent authorized cron requests',async()=>{
 vi.stubEnv('CRON_SECRET','synthetic-cron');
 state.events=[{id:'event',startsAt:new Date(Date.now()+3600000),title:'Event',organizerId:'organizer',organizer:{user:{email:'test@example.test'}},venueName:'Venue'}];
 const request=()=>new Request('https://afters.am/api/cron/event-reminders',{headers:{authorization:'Bearer synthetic-cron'}});
 await Promise.all([GET(request()),GET(request())]);
 expect(state.send).toHaveBeenCalledTimes(1);expect(state.push).toHaveBeenCalledTimes(1);
});
