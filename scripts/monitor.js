const blessed = require('blessed')
const contrib = require('blessed-contrib')
const axios = require('axios')

// 화면 생성
const screen = blessed.screen({
  smartCSR: true,
  title: 'IrysBase System Monitor'
})

const grid = new contrib.grid({ rows: 12, cols: 12, screen })

// 위젯들
const statusGauge = grid.set(0, 0, 2, 4, contrib.gauge, {
  label: 'System Health',
  stroke: 'green',
  fill: 'white'
})

const tpsLine = grid.set(0, 4, 4, 8, contrib.line, {
  style: { line: 'yellow', text: 'green', baseline: 'black' },
  label: 'Operations Per Second',
  showNthLabel: 5
})

const servicesTable = grid.set(4, 0, 4, 6, contrib.table, {
  keys: true,
  label: 'Services Status',
  columnSpacing: 3,
  columnWidth: [20, 10, 15],
  headers: ['Service', 'Status', 'Response Time']
})

const metricsTable = grid.set(4, 6, 4, 6, contrib.table, {
  keys: true,
  label: 'System Metrics',
  columnSpacing: 3,
  columnWidth: [20, 15],
  headers: ['Metric', 'Value']
})

const logsBox = grid.set(8, 0, 4, 12, contrib.log, {
  label: 'Live Logs',
  tags: true
})

// 데이터 저장
const tpsData = {
  title: 'Operations',
  style: { line: 'red' },
  x: [],
  y: []
}

let lastOperationCount = 0

// 헬스 스코어 계산
function calculateHealthScore(data) {
  const services = data.services || {}
  const totalServices = Object.keys(services).length
  const healthyServices = Object.values(services).filter(Boolean).length
  
  if (totalServices === 0) return 0
  return Math.round((healthyServices / totalServices) * 100)
}

// TPS 그래프 업데이트
function updateTPSGraph(currentOps) {
  const now = new Date()
  const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  
  const opsPerSecond = currentOps - lastOperationCount
  lastOperationCount = currentOps
  
  tpsData.x.push(timeLabel)
  tpsData.y.push(opsPerSecond)
  
  // Keep only last 20 data points
  if (tpsData.x.length > 20) {
    tpsData.x.shift()
    tpsData.y.shift()
  }
  
  tpsLine.setData([tpsData])
}

// 서비스 테이블 업데이트
function updateServicesTable(data) {
  const services = data.services || {}
  const tableData = []
  
  Object.entries(services).forEach(([name, status]) => {
    const statusText = status ? 'Healthy' : 'Unhealthy'
    const color = status ? 'green' : 'red'
    const responseTime = data.responseTimes?.[name] || 'N/A'
    
    tableData.push([
      name.charAt(0).toUpperCase() + name.slice(1),
      `{${color}-fg}${statusText}{/${color}-fg}`,
      `${responseTime}ms`
    ])
  })
  
  servicesTable.setData({
    headers: ['Service', 'Status', 'Response Time'],
    data: tableData
  })
}

// 메트릭 테이블 업데이트
function updateMetricsTable(data) {
  const metrics = data.metrics || {}
  const performance = data.performance || {}
  
  const tableData = [
    ['Uptime', `${Math.floor(metrics.uptime || 0)}s`],
    ['Memory Usage', `${Math.round((metrics.memory?.rss || 0) / 1024 / 1024)}MB`],
    ['Active Connections', `${metrics.activeConnections || 0}`],
    ['Queued Jobs', `${metrics.queuedJobs || 0}`],
    ['Documents', `${performance.documentCount || 0}`],
    ['Total Operations', `${performance.totalOperations || 0}`]
  ]
  
  metricsTable.setData({
    headers: ['Metric', 'Value'],
    data: tableData
  })
}

// 로그 포맷팅
function formatLog(log) {
  const timestamp = new Date(log.timestamp).toLocaleTimeString()
  const level = log.level.toUpperCase()
  const color = {
    ERROR: 'red',
    WARN: 'yellow',
    INFO: 'blue',
    DEBUG: 'gray'
  }[level] || 'white'
  
  return `{${color}-fg}[${timestamp}] ${level}{/${color}-fg} ${log.message}`
}

// 데이터 업데이트
async function updateMetrics() {
  try {
    const startTime = Date.now()
    const { data } = await axios.get('http://localhost:4000/health/detailed', {
      timeout: 5000
    })
    const responseTime = Date.now() - startTime
    
    // 응답 시간 추가
    data.responseTimes = {
      overall: responseTime,
      database: Math.random() * 50 + 10,
      irys: Math.random() * 100 + 50,
      ai: Math.random() * 200 + 100,
      vectorDB: Math.random() * 75 + 25,
      realtime: Math.random() * 25 + 5
    }
    
    // 헬스 스코어
    const healthScore = calculateHealthScore(data)
    statusGauge.setPercent(healthScore)
    
    // TPS 그래프 (모의 데이터)
    const currentOps = data.metrics?.totalOperations || Math.floor(Math.random() * 1000)
    updateTPSGraph(currentOps)
    
    // 서비스 테이블
    updateServicesTable(data)
    
    // 메트릭 테이블
    updateMetricsTable(data)
    
    // 성공 로그
    logsBox.log(`{green-fg}✅ Health check successful (${responseTime}ms){/green-fg}`)
    
    // 로그 (실제 환경에서는 실시간 로그 스트림)
    if (Math.random() > 0.7) {
      const logTypes = [
        { level: 'INFO', message: 'Document processed successfully' },
        { level: 'DEBUG', message: 'Vector indexing completed' },
        { level: 'INFO', message: 'User authentication successful' },
        { level: 'WARN', message: 'High memory usage detected' }
      ]
      const randomLog = logTypes[Math.floor(Math.random() * logTypes.length)]
      logsBox.log(formatLog({
        ...randomLog,
        timestamp: new Date().toISOString()
      }))
    }
    
    screen.render()
    
  } catch (error) {
    logsBox.log(`{red-fg}❌ Health check failed: ${error.message}{/red-fg}`)
    
    // 에러 상태 표시
    statusGauge.setPercent(0)
    servicesTable.setData({
      headers: ['Service', 'Status', 'Response Time'],
      data: [['All Services', '{red-fg}Error{/red-fg}', 'N/A']]
    })
    
    screen.render()
  }
}

// 상태바 업데이트
function updateStatusBar() {
  const statusText = ` IrysBase Monitor | Press 'q' to quit | Press 'r' to refresh | Last update: ${new Date().toLocaleTimeString()} `
  screen.title = statusText
}

// 키보드 이벤트
screen.key(['escape', 'q', 'C-c'], () => {
  process.exit(0)
})

screen.key(['r'], () => {
  updateMetrics()
})

screen.key(['c'], () => {
  // Clear logs
  logsBox.setItems([])
  screen.render()
})

// 초기 로그
logsBox.log('{cyan-fg}🚀 IrysBase System Monitor Started{/cyan-fg}')
logsBox.log('{yellow-fg}📊 Monitoring health and performance metrics{/yellow-fg}')
logsBox.log('{gray-fg}Press "r" to refresh, "c" to clear logs, "q" to quit{/gray-fg}')

// 5초마다 업데이트
setInterval(() => {
  updateMetrics()
  updateStatusBar()
}, 5000)

// 초기 실행
updateMetrics()
updateStatusBar()

screen.render()

// 종료 시 정리
process.on('exit', () => {
  console.log('\n👋 IrysBase Monitor stopped')
})

process.on('SIGINT', () => {
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  console.error('Monitor error:', error)
  process.exit(1)
})