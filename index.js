import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

const profile = {
  id: "crypto-nexus",
  name: "Crypto Nexus",
  version: "1.0.0",
  tagline: "Marketplace and catalog for A2A agents plus MCP utilities",
  description: "A marketplace-style front door for browsing, comparing, and packaging agent products, MCP services, and operational bundles.",
  heroLabel: "Catalog Layer",
  author: "dataweb",
  theme: {
    page: "#0c0d15",
    panel: "rgba(20, 22, 34, 0.88)",
    panelEdge: "rgba(255, 125, 90, 0.20)",
    accent: "#ff7d5a",
    accentSoft: "#ffd166",
    glow: "rgba(255, 125, 90, 0.16)"
  },
  agents: {
    curator: (task) => `Curator highlighted the best-fit listings for ${task}.`,
    ranker: (task) => `Ranker scored marketplace fit for ${task}.`,
    concierge: (task) => `Concierge assembled a suggested product bundle for ${task}.`
  },
  tools: [
    {
      name: "list_featured_agents",
      description: "List highlighted A2A and MCP products in the marketplace.",
      inputSchema: { type: "object", properties: { segment: { type: "string", description: "Segment to browse" } }, required: ["segment"] }
    },
    {
      name: "compare_agents",
      description: "Compare multiple agent offerings by fit and operating profile.",
      inputSchema: { type: "object", properties: { products: { type: "string", description: "Comma-separated product names" } }, required: ["products"] }
    },
    {
      name: "price_snapshot",
      description: "Return a pricing and packaging snapshot for a listing tier.",
      inputSchema: { type: "object", properties: { tier: { type: "string", description: "Pricing tier to inspect" } }, required: ["tier"] }
    },
    {
      name: "bundle_builder",
      description: "Build a suggested bundle across marketplace listings.",
      inputSchema: { type: "object", properties: { goal: { type: "string", description: "Use case or buyer goal" } }, required: ["goal"] }
    },
    {
      name: "multi_agent",
      description: "Run curator, ranker, and concierge for a catalog request.",
      inputSchema: { type: "object", properties: { task: { type: "string", description: "Catalog or buyer request" } }, required: ["task"] }
    }
  ],
  prompts: [
    {
      name: "catalog_strategy",
      description: "Build a positioning plan for catalog growth and partner listings.",
      arguments: [{ name: "segment", description: "Marketplace segment", required: false }]
    },
    {
      name: "listing_template",
      description: "Generate a high-conversion listing template for an agent product.",
      arguments: [{ name: "product", description: "Product or listing name", required: false }]
    }
  ],
  skills: [
    { name: "list_featured_agents", description: "List highlighted A2A and MCP products in the marketplace." },
    { name: "compare_agents", description: "Compare two or more agent products by fit and capabilities." },
    { name: "bundle_builder", description: "Build stack bundles from complementary agents and tools." },
    { name: "catalog_strategy", description: "Generate catalog positioning and listing strategy prompts." },
    { name: "market_map", description: "Map the marketplace by segment, price, and usage." },
    { name: "listing_audit", description: "Audit listing quality, trust cues, and clarity." },
    { name: "buyer_fit", description: "Match buyer goals to the right product stack." },
    { name: "vendor_ranking", description: "Rank vendors by segment strength and adoption signals." },
    { name: "price_snapshot", description: "Read packaging and pricing posture across listing tiers." },
    { name: "niche_spotlight", description: "Surface promising niche categories inside the catalog." },
    { name: "partner_feed", description: "Track partner changes and new listing activity." },
    { name: "offer_design", description: "Design marketplace offers and commercial bundles." },
    { name: "launch_merchandising", description: "Prepare featured-slot launch positioning for new listings." }
  ],
  resources: [
    {
      uri: "resource://crypto-nexus/featured-catalog",
      name: "featured_catalog",
      description: "Featured agent cards and MCP products in the marketplace.",
      mimeType: "application/json"
    },
    {
      uri: "resource://crypto-nexus/partner-feed",
      name: "partner_feed",
      description: "Partner listing feed and recent catalog changes.",
      mimeType: "application/json"
    }
  ]
};

const memory = {};

function getBaseUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return `${protocol}://${req.get("host")}`;
}

function getSessionId(req) {
  return req.headers["x-session-id"] || "default";
}

function ensureSession(sessionId) {
  if (!memory[sessionId]) memory[sessionId] = [];
  return memory[sessionId];
}

function logEntry(sessionId, entry) {
  ensureSession(sessionId).push({ timestamp: Date.now(), ...entry });
}

function rpcSuccess(id, result) { return { jsonrpc: "2.0", id, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }; }
function makeText(text) { return { content: [{ type: "text", text }] }; }

function buildAgentCard(req) {
  const baseUrl = getBaseUrl(req);
  return {
    name: profile.name,
    description: profile.description,
    url: `${baseUrl}/`,
    version: profile.version,
    author: profile.author,
    capabilities: ["mcp", "a2a", "tools", "prompts", "resources"],
    endpoints: { mcp: `${baseUrl}/mcp`, a2a: `${baseUrl}/a2a`, agentCard: `${baseUrl}/.well-known/agent-card.json` },
    skills: profile.skills
  };
}

function getOverview(req) {
  return {
    profile: profile.id,
    serverInfo: { name: profile.name, version: profile.version },
    protocol: "MCP over JSON-RPC 2.0",
    transport: { endpoint: `${getBaseUrl(req)}/mcp`, method: "POST", contentType: "application/json" },
    capabilities: { tools: {}, prompts: {}, resources: {} },
    tools: profile.tools,
    prompts: profile.prompts,
    resources: profile.resources
  };
}

function executeTool(toolName, args, sessionId) {
  logEntry(sessionId, { type: "tool", name: toolName, arguments: args });
  if (toolName === "list_featured_agents") return makeText(`Featured segment ${args.segment}: NovaChain Agents, RiskCanvas MCP, WalletPulse A2A, and ChainStudio Pro.`);
  if (toolName === "compare_agents") return makeText(`Comparison for ${args.products}: one product leads on orchestration, one on price efficiency, and one on UX polish.`);
  if (toolName === "price_snapshot") return makeText(`Tier ${args.tier}: starter seats, usage-based MCP calls, optional A2A premium support, and bundled credits.`);
  if (toolName === "bundle_builder") return makeText(`Bundle for ${args.goal}: listing engine + risk scanner + collaboration agent + dashboard skin.`);
  if (toolName === "multi_agent") return makeText(["Crypto Nexus multi-agent run complete.", profile.agents.curator(args.task), profile.agents.ranker(args.task), profile.agents.concierge(args.task)].join("\n"));
  throw new Error(`Unknown tool: ${toolName}`);
}

function getPrompt(promptName, args = {}) {
  if (promptName === "catalog_strategy") {
    const segment = args.segment || "the current agent economy";
    return { description: "Catalog strategy prompt.", messages: [{ role: "user", content: { type: "text", text: `Design a marketplace strategy for ${segment}. Include merchandising, trust signals, bundles, and partner onboarding.` } }] };
  }
  if (promptName === "listing_template") {
    const product = args.product || "a new A2A product";
    return { description: "Listing template prompt.", messages: [{ role: "user", content: { type: "text", text: `Write a compelling marketplace listing for ${product}. Cover outcome, MCP tools, A2A roles, pricing cues, and buyer proof.` } }] };
  }
  throw new Error(`Unknown prompt: ${promptName}`);
}

function readResource(uri) {
  if (uri === "resource://crypto-nexus/featured-catalog") {
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ listings: [
      { name: "NovaChain Agents", type: "Dashboard", tag: "A2A + MCP" },
      { name: "Opsdeck Control", type: "Operations", tag: "Incident AI" },
      { name: "Chain Studio", type: "Studio", tag: "IDE-style" }
    ] }, null, 2) }] };
  }
  if (uri === "resource://crypto-nexus/partner-feed") {
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ changes: [
      { partner: "Signal Foundry", action: "new listing", when: "today" },
      { partner: "Runtime Atlas", action: "price update", when: "2h ago" }
    ] }, null, 2) }] };
  }
  throw new Error(`Unknown resource: ${uri}`);
}

function runA2A(agentName, task, sessionId) {
  const agent = profile.agents[agentName];
  if (!agent) throw new Error(`Unknown agent: ${agentName}`);
  logEntry(sessionId, { type: "a2a", agent: agentName, task });
  return { agent: agentName, result: agent(task || "default task"), status: "ok", profile: profile.id };
}

function handleRpc(req, res) {
  const body = req.body || {};
  const id = body.id ?? null;
  const method = body.method;
  const params = body.params || {};
  const sessionId = getSessionId(req);
  if (!method) return res.status(400).json(rpcError(id, -32600, "Missing JSON-RPC method"));

  try {
    if (method === "initialize") return res.json(rpcSuccess(id, { protocolVersion: "2024-11-05", capabilities: { tools: {}, prompts: {}, resources: {} }, serverInfo: { name: profile.name, version: profile.version }, instructions: "Use tools/list, prompts/list, and resources/list to inspect Crypto Nexus listings." }));
    if (method === "ping") return res.json(rpcSuccess(id, {}));
    if (method === "notifications/initialized") return id === null ? res.status(202).end() : res.json(rpcSuccess(id, {}));
    if (method === "tools/list") return res.json(rpcSuccess(id, { tools: profile.tools }));
    if (method === "tools/call") return res.json(rpcSuccess(id, executeTool(params.name, params.arguments || {}, sessionId)));
    if (method === "prompts/list") return res.json(rpcSuccess(id, { prompts: profile.prompts }));
    if (method === "prompts/get") return res.json(rpcSuccess(id, getPrompt(params.name, params.arguments || {})));
    if (method === "resources/list") return res.json(rpcSuccess(id, { resources: profile.resources }));
    if (method === "resources/read") return res.json(rpcSuccess(id, readResource(params.uri)));
    return res.status(404).json(rpcError(id, -32601, `Method not found: ${method}`));
  } catch (error) {
    return res.status(400).json(rpcError(id, -32000, error instanceof Error ? error.message : "Internal error"));
  }
}

function buildUi() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${profile.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Outfit:wght@500;700;800&display=swap" rel="stylesheet" />
  <style>
    :root{--page:#0c0d15;--panel:rgba(20,22,34,.88);--edge:rgba(255,125,90,.2);--accent:#ff7d5a;--soft:#ffd166;--text:#fff6ef;--muted:#cdbab0;--line:rgba(255,255,255,.08)}
    *{box-sizing:border-box}body{margin:0;font-family:"Manrope",sans-serif;background:radial-gradient(circle at 15% 10%,rgba(255,125,90,.16),transparent 26%),linear-gradient(180deg,rgba(255,255,255,.02),transparent 18%),var(--page);color:var(--text)}
    .shell{max-width:1260px;margin:0 auto;padding:24px}.nav,.hero,.panel{border:1px solid var(--edge);background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.015)),var(--panel);border-radius:28px;box-shadow:0 22px 64px rgba(0,0,0,.30)}
    .nav{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 18px}.brand{display:flex;align-items:center;gap:12px}.brand-mark{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--soft),var(--accent));display:grid;place-items:center;color:#22110b;font-family:"Outfit",sans-serif;font-weight:800}.brand strong,h1,h2,h3{font-family:"Outfit",sans-serif;letter-spacing:-.03em}.brand strong{display:block;font-size:18px}.brand span,.nav a,p,.meta{color:var(--muted)}.nav-links{display:flex;gap:16px;flex-wrap:wrap}.nav-links a{text-decoration:none;color:var(--muted);font-size:14px}
    .hero{padding:30px;margin-top:18px}.hero-grid,.main-grid,.catalog-grid,.mini-grid,.endpoint-grid{display:grid;gap:18px}.hero-grid{grid-template-columns:1.08fr .92fr;align-items:end}.main-grid{grid-template-columns:1fr;gap:24px;margin-top:24px}.catalog-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.endpoint-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    .eyebrow,.badge,.chip{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;border:1px solid var(--edge);background:rgba(255,255,255,.04);color:var(--soft);font-size:12px;text-transform:uppercase;letter-spacing:.12em}h1{margin:16px 0 0;font-size:clamp(42px,8vw,78px);line-height:.94;max-width:10ch}p{line-height:1.7}.cta-row,.toolbar,.chip-row{display:flex;gap:10px;flex-wrap:wrap}.cta-row{margin-top:22px}
    .btn,button{border:0;border-radius:14px;padding:12px 16px;font:inherit;font-weight:800;cursor:pointer;transition:transform .18s ease,filter .18s ease}.btn,button{background:linear-gradient(135deg,var(--accent),var(--soft));color:#26140c}.btn.alt{background:rgba(255,255,255,.04);color:var(--text);border:1px solid var(--line)}.btn:hover,button:hover{transform:translateY(-1px);filter:brightness(1.04)}
    .panel{padding:22px}.section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.listing,.item,.metric,.endpoint{border-radius:22px;border:1px solid var(--line);background:rgba(255,255,255,.03);padding:18px}.listing{min-height:220px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}.listing::after{content:"";position:absolute;right:-30px;top:-40px;width:120px;height:120px;border-radius:999px;background:radial-gradient(circle,rgba(255,209,102,.12),transparent 70%)}.listing strong,.metric strong{display:block;margin-top:10px;font-size:28px;font-family:"Outfit",sans-serif}.price{font-size:14px;color:var(--soft)}.list{display:grid;gap:12px}.endpoint code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.endpoint code{display:block;margin-top:8px;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.22);color:#ffe1ce;overflow-wrap:anywhere}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}pre{margin:14px 0 0;min-height:280px;max-height:460px;overflow:auto;padding:16px;border-radius:18px;background:rgba(0,0,0,.34);color:#fff0e4;border:1px solid rgba(255,209,102,.1)}@media (max-width:1040px){.hero-grid,.catalog-grid,.metric-grid,.mini-grid,.endpoint-grid{grid-template-columns:1fr}}@media (max-width:640px){.shell{padding:16px}.nav-links{display:none}.hero,.panel{padding:18px;border-radius:24px}h1{font-size:48px}}
  </style>
</head>
<body>
  <div class="shell">
    <nav class="nav">
      <div class="brand"><div class="brand-mark">CN</div><div><strong>${profile.name}</strong><span>${profile.tagline}</span></div></div>
      <div class="nav-links"><a href="#catalog">Catalog</a><a href="#compare">Compare</a><a href="#console">Console</a></div>
    </nav>

    <section class="hero">
      <div class="hero-grid">
        <div>
          <span class="eyebrow">${profile.heroLabel}</span>
          <h1>Browse A2A agents and MCP products like a real marketplace.</h1>
          <p>${profile.description} Crypto Nexus is laid out like a storefront: featured listings, category chips, pricing cues, and a built-in console for inspecting the underlying protocol surfaces.</p>
          <div class="chip-row"><span class="chip">A2A agents</span><span class="chip">MCP tools</span><span class="chip">Bundles</span><span class="chip">Catalog APIs</span></div>
          <div class="cta-row"><a class="btn" href="#catalog">Browse catalog</a><a class="btn alt" href="/.well-known/agent-card.json">Agent card</a></div>
        </div>
        <div class="metric-grid">
          <div class="metric"><span class="badge">Listings</span><strong>24</strong><p>Mixed A2A and MCP products</p></div>
          <div class="metric"><span class="badge">Bundles</span><strong>8</strong><p>Curated use-case stacks</p></div>
          <div class="metric"><span class="badge">Partners</span><strong>11</strong><p>Catalog contributors</p></div>
          <div class="metric"><span class="badge">Segments</span><strong>6</strong><p>Discovery categories</p></div>
        </div>
      </div>
    </section>

    <section class="panel" id="catalog">
      <div class="section-head"><h2>Featured Listings</h2><span class="badge">Marketplace</span></div>
      <div class="catalog-grid">
        <div class="listing"><div><span class="badge">Featured</span><strong>NovaChain Agents</strong><p>Swarm dashboard for wallet-aware A2A operations.</p></div><div class="price">Starter bundle • MCP + A2A</div></div>
        <div class="listing"><div><span class="badge">Trending</span><strong>Chain Studio</strong><p>IDE-style environment for designing and testing agents.</p></div><div class="price">Builder tier • Studio runtime</div></div>
        <div class="listing"><div><span class="badge">Popular</span><strong>RiskCanvas MCP</strong><p>Risk intelligence tools for treasury and wallet teams.</p></div><div class="price">Usage-based • MCP calls</div></div>
      </div>
    </section>

    <section class="main-grid">
      <div class="panel" id="compare">
        <div class="section-head"><h2>Compare and Bundle</h2><span class="badge">Decisioning</span></div>
        <div class="mini-grid">${profile.tools.map((tool) => `<div class="item"><strong>${tool.name}</strong><p>${tool.description}</p></div>`).join("")}</div>
      </div>
      <div class="panel">
        <div class="section-head"><h2>Catalog Context</h2><span class="badge">Prompts</span></div>
        <div class="mini-grid">${profile.prompts.map((prompt) => `<div class="item"><strong>${prompt.name}</strong><p>${prompt.description}</p></div>`).join("")}${profile.resources.map((resource) => `<div class="item"><strong>${resource.name}</strong><p>${resource.description}</p><div class='price'>${resource.uri}</div></div>`).join("")}</div>
      </div>
      <div class="panel">
        <div class="section-head"><h2>Endpoints</h2><span class="badge">Routes</span></div>
        <div class="endpoint-grid"><div class="endpoint"><span class="badge">MCP</span><code>/mcp</code></div><div class="endpoint"><span class="badge">A2A</span><code>/a2a</code></div><div class="endpoint"><span class="badge">Card</span><code>/.well-known/agent-card.json</code></div><div class="endpoint"><span class="badge">Resource</span><code>/resources/featured_catalog</code></div></div>
      </div>
      <div class="panel" id="console">
        <div class="section-head"><h2>Buyer Console</h2><span class="badge">JSON-RPC</span></div>
        <div class="toolbar"><button id="initializeBtn">Initialize</button><button id="toolsBtn">Tools List</button><button id="toolCallBtn">Call First Tool</button><button id="resourceBtn">Read First Resource</button><button id="a2aBtn">Run A2A</button></div>
        <pre id="output">Use the console to inspect Crypto Nexus MCP and A2A responses.</pre>
      </div>
    </section>
  </div>
  <script>
    const sampleToolArgs={list_featured_agents:{segment:'trading'},compare_agents:{products:'NovaChain Agents, Chain Studio'},price_snapshot:{tier:'pro'},bundle_builder:{goal:'launch an agent product'},multi_agent:{task:'buyer shortlist'}};
    async function postJson(body,endpoint){const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return response.json();}
    document.getElementById('initializeBtn').addEventListener('click',async function(){const data=await postJson({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'ui-tester',version:'1.0.0'}}},'/mcp');document.getElementById('output').textContent=JSON.stringify(data,null,2);});
    document.getElementById('toolsBtn').addEventListener('click',async function(){const data=await postJson({jsonrpc:'2.0',id:2,method:'tools/list'},'/mcp');document.getElementById('output').textContent=JSON.stringify(data,null,2);});
    document.getElementById('toolCallBtn').addEventListener('click',async function(){const firstTool='list_featured_agents';const data=await postJson({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:firstTool,arguments:sampleToolArgs[firstTool]}},'/mcp');document.getElementById('output').textContent=JSON.stringify(data,null,2);});
    document.getElementById('resourceBtn').addEventListener('click',async function(){const data=await postJson({jsonrpc:'2.0',id:4,method:'resources/read',params:{uri:'resource://crypto-nexus/featured-catalog'}},'/mcp');document.getElementById('output').textContent=JSON.stringify(data,null,2);});
    document.getElementById('a2aBtn').addEventListener('click',async function(){const data=await postJson({agent:'curator',task:'buyer shortlist'},'/a2a');document.getElementById('output').textContent=JSON.stringify(data,null,2);});
  </script>
</body>
</html>`;
}

app.get("/.well-known/agent-card.json", (req, res) => { res.json(buildAgentCard(req)); });
app.get("/mcp", (req, res) => { res.json(getOverview(req)); });
app.post("/mcp", (req, res) => {
  if (req.body?.jsonrpc === "2.0") return handleRpc(req, res);
  const sessionId = getSessionId(req);
  try {
    const result = executeTool(req.body?.tool || profile.tools[0].name, req.body?.input || {}, sessionId);
    return res.json({ output: { profile: profile.id, result: result.content[0].text, agent: profile.name } });
  } catch {
    return res.status(400).json({ output: { profile: profile.id, result: "Recovered from error", agent: profile.name } });
  }
});
app.get("/resources/:resourceName", (req, res) => {
  const resource = profile.resources.find((item) => item.name === req.params.resourceName);
  if (!resource) return res.status(404).json({ error: "Resource not found" });
  return res.json(JSON.parse(readResource(resource.uri).contents[0].text));
});
app.post("/a2a", (req, res) => {
  try { res.json(runA2A(req.body?.agent, req.body?.task, getSessionId(req))); }
  catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "A2A failed" }); }
});
app.get("/", (req, res) => { res.send(buildUi()); });

export default app;
