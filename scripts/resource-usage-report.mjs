try { process.loadEnvFile(".env.local"); } catch {}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const days = Number(process.argv[2] ?? 30);
if (!url || !key || !Number.isInteger(days) || days < 1 || days > 400) {
  console.error("Configure the server Supabase key and pass a number of days between 1 and 400."); process.exit(1);
}
const from = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
const response = await fetch(`${url}/rest/v1/resource_usage_daily?select=day,event,locale,resource,count&day=gte.${from}&order=day.desc&limit=10000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
if (!response.ok) { console.error(`Usage report unavailable (${response.status}).`); process.exit(1); }
console.log("Daily UTC interaction counts. Not unique visitors, matched conversions or confirmed reading.");
console.table(await response.json());
