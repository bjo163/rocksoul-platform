import { readFile } from "node:fs/promises"

const contract = JSON.parse(await readFile(new URL("../contracts/rocksoul.ecosystem.v1.json", import.meta.url), "utf8"))
const expectedDomains = {
  STORY: ["rocksoul-mftl", "mftl:"],
  EVENT: ["rocksoul-legend", "legend:"],
  PERSON: ["rocksoul-superhero", "superhero:"],
  TEXT: ["rocksoul-rgbl", "rgbl:"],
  LAW: ["rocksoul-aws", "aws:"],
  PERSPECTIVE: ["rocksoul-jizz", "jizz:"],
  RELATIONSHIP: ["rocksoul-correlation", "correlation:"],
}
const expectedProducts = {
  DESIGN: "rocksoul-assets",
  UI: "rocksoul-ui",
  PUBLIC: "rocksoul-web",
  COMMUNITY: "rocksoul-community",
  ADMIN_IAM: "rocksoul-platform",
  OPERATIONS: "rocksoul-crayon",
}
const failures = []

if (contract.version !== "rocksoul.ecosystem.v1") failures.push("unexpected contract version")
if (contract.canonical_branch !== "main") failures.push("canonical branch must be main")

const ownerRepositories = new Set()
const prefixes = new Set()
for (const [domain, [repository, prefix]] of Object.entries(expectedDomains)) {
  const actual = contract.domains?.[domain]
  if (!actual) failures.push(`missing domain ${domain}`)
  else {
    if (actual.repository !== repository) failures.push(`${domain} owner must be ${repository}`)
    if (actual.prefix !== prefix) failures.push(`${domain} prefix must be ${prefix}`)
    if (ownerRepositories.has(actual.repository)) failures.push(`duplicate canonical domain owner ${actual.repository}`)
    if (prefixes.has(actual.prefix)) failures.push(`duplicate qualified-reference prefix ${actual.prefix}`)
    ownerRepositories.add(actual.repository)
    prefixes.add(actual.prefix)
  }
}
if (Object.keys(contract.domains ?? {}).length !== Object.keys(expectedDomains).length) failures.push("unexpected semantic domain declaration")

for (const [layer, repository] of Object.entries(expectedProducts)) {
  if (contract.product_layers?.[layer] !== repository) failures.push(`${layer} owner must be ${repository}`)
}

if (contract.principles?.repository_identity_is_domain_identity !== false) failures.push("repository identity must remain distinct from semantic domain identity")
if (contract.principles?.foreign_reference_branch !== "main") failures.push("canonical foreign references must resolve against main")

if (failures.length) {
  console.error("Ecosystem ownership contract invalid:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log("Ecosystem ownership contract valid: 7 semantic owners, 6 product-layer owners, canonical branch main.")
