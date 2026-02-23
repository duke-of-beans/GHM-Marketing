// scripts/basecamp-crawl.ts
// Crawls all Basecamp 4 projects and dumps structured data to JSON
// Run: npx tsx scripts/basecamp-crawl.ts
// Output: scripts/basecamp-dump.json

import { readFileSync, writeFileSync } from 'fs'

// Load .env.local
const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const eqIdx = line.indexOf('=')
  if (eqIdx > 0) {
    const k = line.slice(0, eqIdx).trim()
    const v = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (k && v) process.env[k] = v
  }
}

import { prisma } from '../src/lib/db.js'
import { getBasecampClient } from '../src/lib/basecamp/index.js'

const USER_AGENT = 'GHM Dashboard (https://ghm.covos.app)'

async function main() {
  console.log('Connecting to Basecamp...')
  const bc = await getBasecampClient()

  console.log('Fetching projects...')
  const projects = await bc.getProjects()
  console.log(`  Found ${projects.length} projects`)

  const dump: Record<string, unknown>[] = []

  for (const project of projects) {
    console.log(`\nProject: ${project.name} (${project.id})`)
    const projectData: Record<string, unknown> = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      created_at: project.created_at,
      app_url: project.app_url,
    }

    // Todolists + todos
    try {
      const todolists = await bc.getTodolists(project.id)
      console.log(`  ${todolists.length} todolists`)
      const lists = []
      for (const list of todolists) {
        const todos = await bc.getTodos(project.id, list.id)
        lists.push({ ...list, todos })
        console.log(`    "${list.title}" — ${todos.length} todos`)
      }
      projectData.todolists = lists
    } catch (e) { projectData.todolists_error = String(e) }

    // Messages
    try {
      const messages = await bc.getMessages(project.id)
      console.log(`  ${messages.length} messages`)
      projectData.messages = messages
    } catch (e) { projectData.messages_error = String(e) }

    // Documents
    try {
      const docs = await bc.getDocuments(project.id)
      console.log(`  ${docs.length} documents`)
      projectData.documents = docs
    } catch (e) { projectData.documents_error = String(e) }

    // Uploads
    try {
      const uploads = await bc.getUploads(project.id)
      console.log(`  ${uploads.length} uploads`)
      projectData.uploads = uploads
    } catch (e) { projectData.uploads_error = String(e) }

    dump.push(projectData)
  }

  // People
  try {
    const people = await bc.getPeople()
    console.log(`\n${people.length} people in account`)
    writeFileSync('scripts/basecamp-dump.json', JSON.stringify({ projects: dump, people }, null, 2))
  } catch (e) {
    writeFileSync('scripts/basecamp-dump.json', JSON.stringify({ projects: dump }, null, 2))
  }

  console.log('\n✅ Done — output: scripts/basecamp-dump.json')
  await prisma.$disconnect()
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1) })
