const owner = "bjo163"
const headers = { accept: "application/vnd.github.raw+json", "user-agent": "rocksoul-ecosystem-certifier" }
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function get(path) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${path}`, { headers })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  return response.text()
}

const failures = []
const repos = [
  "rocksoul-mftl","rocksoul-legend","rocksoul-superhero","rocksoul-rgbl","rocksoul-aws","rocksoul-jizz","rocksoul-correlation",
  "rocksoul-assets","rocksoul-ui","rocksoul-web","rocksoul-community","rocksoul-platform","rocksoul-crayon",
]

for (const repo of repos) {
  try {
    const branch = JSON.parse(await get(`${repo}/branches/main`))
    if (!branch.commit?.sha) failures.push(`${repo}: main HEAD missing`)
  } catch (error) { failures.push(error.message) }
}

const checks = [
  ["rocksoul-jizz/contents/src/model.mjs?ref=main", ["DOMAIN = \"PERSPECTIVE\"", "rocksoul-correlation"]],
  ["rocksoul-correlation/contents/schemas/correlation-edge.schema.json?ref=main", ["PERSPECTIVE", "rocksoul-jizz"]],
  ["rocksoul-correlation/contents/src/qualified-ref.mjs?ref=main", ["jizz", "rocksoul-jizz", "PERSPECTIVE"]],
  ["rocksoul-ui/contents/src/contracts/ecosystem-domains.ts?ref=main", ["PERSPECTIVE", "rocksoul-jizz", "RELATIONSHIP"]],
  ["rocksoul-web/contents/src/correlation-api.ts?ref=main", ["PERSPECTIVE"]],
  ["rocksoul-aws/contents/data/ownership-classification.json?ref=main", ["CANONICAL_AWS", "data/aws/**", "LEGACY_ENGINE_INPUT"]],
  ["rocksoul-platform/contents/contracts/rocksoul.ecosystem.v1.json?ref=main", ["rocksoul.ecosystem.v1", "PERSPECTIVE", "RELATIONSHIP"]],
]

for (const [path, markers] of checks) {
  try {
    const body = await get(path)
    for (const marker of markers) if (!body.includes(marker)) failures.push(`${path}: missing ${marker}`)
  } catch (error) { failures.push(error.message) }
}

if (failures.length) {
  console.error("ROCKSOUL ecosystem certification failed:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("ROCKSOUL ecosystem certification passed against current main branches only.")
