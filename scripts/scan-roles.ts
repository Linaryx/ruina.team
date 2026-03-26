import { $fetch } from "ofetch";

const channel = process.argv[2] || "zakvielchannel";

const fetchRoles = async (type: "mods" | "vips") => {
  const url = `https://tools.2807.eu/api/get${type}/${encodeURIComponent(channel)}`;
  try {
    const res = await $fetch<any[]>(url);
    return Array.isArray(res) ? res : [];
  } catch (e) {
    console.error(`Failed to fetch ${type}:`, e);
    return [];
  }
};

async function main() {
  console.log(`Scanning roles for channel: ${channel}`);
  const [mods, vips] = await Promise.all([fetchRoles("mods"), fetchRoles("vips")]);
  console.log(`Mods (${mods.length}):`, mods.map((m) => m.login || m.name || m.id).join(", "));
  console.log(`VIPs (${vips.length}):`, vips.map((v) => v.login || v.name || v.id).join(", "));
}

main();
