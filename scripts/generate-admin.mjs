import { randomBytes,scryptSync } from "node:crypto";
const alpha="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(buf){let bits=0,val=0,out="";for(const b of buf){val=(val<<8)|b;bits+=8;while(bits>=5){out+=alpha[(val>>>(bits-5))&31];bits-=5}}if(bits)out+=alpha[(val<<(5-bits))&31];return out}
const password=process.argv.slice(2).join(" ");if(!password){console.error("Usage: node scripts/generate-admin.mjs YOUR_PASSWORD");process.exit(1)}
const salt=randomBytes(16),totp=randomBytes(20),hash=scryptSync(password,salt,64,{N:16384,r:8,p:1});
console.log("ADMIN_PASSWORD_HASH="+["scrypt",16384,8,1,salt.toString("base64"),hash.toString("base64")].join("$"));
console.log("ADMIN_TOTP_SECRET_BASE32="+base32(totp));
console.log("ADMIN_SESSION_SECRET="+randomBytes(48).toString("base64url"));
