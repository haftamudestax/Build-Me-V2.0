const ZapClient = require("zaproxy");

const target = "http://localhost:4000";
const zapOptions = {
  apiKey: "", // Add API key if enabled in ZAP settings
  zapApiUrl: "http://localhost:8080",
};

const zap = new ZapClient(zapOptions);

async function runScan() {
  console.log(`Starting ZAP Spider on ${target}...`);
  const spiderResponse = await zap.spider.scan({ url: target });
  const scanId = spiderResponse.scan;

  // Wait for spider to finish
  let status = "0";
  while (parseInt(status) < 100) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusRes = await zap.spider.status({ scanId });
    status = statusRes.status;
    console.log(`Spider progress: ${status}%`);
  }

  console.log("Starting Active Scan...");
  const activeScanRes = await zap.ascan.scan({ url: target });
  const activeScanId = activeScanRes.scan;

  status = "0";
  while (parseInt(status) < 100) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const statusRes = await zap.ascan.status({ scanId: activeScanId });
    status = statusRes.status;
    console.log(`Active Scan progress: ${status}%`);
  }

  console.log("Scan complete! Fetching alerts...");
  const alerts = await zap.core.alerts({ baseurl: target });
  console.log(`Found ${alerts.alerts.length} potential vulnerabilities.`);
}

runScan().catch(console.error);
