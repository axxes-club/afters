import {it,expect,vi,afterEach} from "vitest";
import {securityClientKey} from "@/lib/security-client-key";
afterEach(()=>vi.unstubAllEnvs());
it("ignores spoofed forwarding when ingress trust is unconfigured",()=>{vi.stubEnv("TRUSTED_PROXY_HOPS","");expect(securityClientKey(new Request("https://test",{headers:{"x-forwarded-for":"1.2.3.4"}}))).toBe("anonymous");});
it("selects the configured trusted chain position rather than the attacker first entry",()=>{vi.stubEnv("TRUSTED_PROXY_HOPS","2");expect(securityClientKey(new Request("https://test",{headers:{"x-forwarded-for":"1.2.3.4, 5.6.7.8, 10.0.0.1"}}))).toBe("5.6.7.8");});
it("fails closed on malformed configured forwarding",()=>{vi.stubEnv("TRUSTED_PROXY_HOPS","1");expect(securityClientKey(new Request("https://test",{headers:{"x-forwarded-for":"not-an-ip"}}))).toBe("anonymous");});
