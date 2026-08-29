import pkg from 'pg'
const { Pool } = pkg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  const e = await pool.query('SELECT COUNT(*) as c FROM exam')
  const q = await pool.query('SELECT COUNT(*) as c FROM question')
  const o = await pool.query('SELECT COUNT(*) as c FROM option')
  const s = await pool.query(
    'SELECT s.name, COUNT(q.id) as cnt FROM question q JOIN subject s ON q.subject_id = s.id GROUP BY s.name ORDER BY s.name'
  )
  console.log(`Exams: ${e.rows[0].c} | Questions: ${q.rows[0].c} | Options: ${o.rows[0].c}`)
  console.log('By subject:')
  s.rows.forEach(r => console.log(`  ${r.name}: ${r.cnt}`))
} finally {
  await pool.end()
}
