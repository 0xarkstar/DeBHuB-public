/**
 * Irys Performance Benchmark Test
 *
 * 실제 Irys 쿼리 성능을 측정하여 Irys-Only 아키텍처의 실현 가능성을 평가합니다.
 *
 * 테스트 시나리오:
 * 1. 단일 트랜잭션 조회
 * 2. 태그 기반 검색 (10개 결과)
 * 3. 태그 기반 검색 (100개 결과)
 * 4. 복잡한 태그 조합 검색
 * 5. 데이터 fetch 포함 전체 워크플로우
 * 6. N+1 쿼리 시나리오 (관계형 데이터)
 */

import Query from '@irys/query';

interface BenchmarkResult {
  test: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
  status: 'success' | 'error';
  error?: string;
}

class IrysPerformanceBenchmark {
  private query: Query;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.query = new Query();
  }

  /**
   * 시간 측정 유틸리티
   */
  private async measureTime(
    fn: () => Promise<any>,
    iterations: number = 5
  ): Promise<{ avg: number; min: number; max: number; times: number[] }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await fn();
      } catch (error) {
        console.error(`Iteration ${i + 1} failed:`, error);
      }
      const end = performance.now();
      times.push(end - start);

      // 각 측정 사이에 100ms 대기 (rate limiting 방지)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times
    };
  }

  /**
   * Test 1: 단일 트랜잭션 조회
   */
  async testSingleTransactionQuery() {
    console.log('\n📊 Test 1: Single Transaction Query');
    console.log('━'.repeat(50));

    try {
      const { avg, min, max, times } = await this.measureTime(async () => {
        await this.query
          .search('irys:transactions')
          .limit(1);
      }, 10);

      console.log(`✅ Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      console.log(`   All times: ${times.map(t => t.toFixed(0)).join(', ')}ms`);

      this.results.push({
        test: 'Single Transaction Query',
        avgTime: avg,
        minTime: min,
        maxTime: max,
        iterations: 10,
        status: 'success'
      });
    } catch (error) {
      console.error('❌ Error:', error);
      this.results.push({
        test: 'Single Transaction Query',
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 10,
        status: 'error',
        error: String(error)
      });
    }
  }

  /**
   * Test 2: 태그 기반 검색 (10개 결과)
   */
  async testSmallTagSearch() {
    console.log('\n📊 Test 2: Tag-based Search (10 results)');
    console.log('━'.repeat(50));

    try {
      const { avg, min, max, times } = await this.measureTime(async () => {
        await this.query
          .search('irys:transactions')
          .tags([
            { name: 'Content-Type', values: ['application/json'] }
          ])
          .limit(10);
      }, 10);

      console.log(`✅ Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      console.log(`   All times: ${times.map(t => t.toFixed(0)).join(', ')}ms`);

      this.results.push({
        test: 'Small Tag Search (10 results)',
        avgTime: avg,
        minTime: min,
        maxTime: max,
        iterations: 10,
        status: 'success'
      });
    } catch (error) {
      console.error('❌ Error:', error);
      this.results.push({
        test: 'Small Tag Search (10 results)',
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 10,
        status: 'error',
        error: String(error)
      });
    }
  }

  /**
   * Test 3: 태그 기반 검색 (100개 결과)
   */
  async testLargeTagSearch() {
    console.log('\n📊 Test 3: Tag-based Search (100 results)');
    console.log('━'.repeat(50));

    try {
      const { avg, min, max, times } = await this.measureTime(async () => {
        await this.query
          .search('irys:transactions')
          .tags([
            { name: 'Content-Type', values: ['application/json'] }
          ])
          .limit(100);
      }, 5);

      console.log(`✅ Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      console.log(`   All times: ${times.map(t => t.toFixed(0)).join(', ')}ms`);

      this.results.push({
        test: 'Large Tag Search (100 results)',
        avgTime: avg,
        minTime: min,
        maxTime: max,
        iterations: 5,
        status: 'success'
      });
    } catch (error) {
      console.error('❌ Error:', error);
      this.results.push({
        test: 'Large Tag Search (100 results)',
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 5,
        status: 'error',
        error: String(error)
      });
    }
  }

  /**
   * Test 4: 복잡한 태그 조합 검색
   */
  async testComplexTagSearch() {
    console.log('\n📊 Test 4: Complex Multi-Tag Search');
    console.log('━'.repeat(50));

    try {
      const { avg, min, max, times } = await this.measureTime(async () => {
        await this.query
          .search('irys:transactions')
          .tags([
            { name: 'App-Name', values: ['DeBHuB'] },
            { name: 'Entity-Type', values: ['document', 'project'] },
            { name: 'Content-Type', values: ['application/json'] }
          ])
          .limit(20);
      }, 10);

      console.log(`✅ Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      console.log(`   All times: ${times.map(t => t.toFixed(0)).join(', ')}ms`);

      this.results.push({
        test: 'Complex Multi-Tag Search',
        avgTime: avg,
        minTime: min,
        maxTime: max,
        iterations: 10,
        status: 'success'
      });
    } catch (error) {
      console.error('❌ Error:', error);
      this.results.push({
        test: 'Complex Multi-Tag Search',
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 10,
        status: 'error',
        error: String(error)
      });
    }
  }

  /**
   * Test 5: 전체 워크플로우 (쿼리 + 데이터 fetch)
   */
  async testFullWorkflow() {
    console.log('\n📊 Test 5: Full Workflow (Query + Data Fetch)');
    console.log('━'.repeat(50));

    try {
      const { avg, min, max, times } = await this.measureTime(async () => {
        // 1. 쿼리 실행
        const results = await this.query
          .search('irys:transactions')
          .tags([
            { name: 'Content-Type', values: ['application/json'] }
          ])
          .limit(5);

        // 2. 각 결과의 데이터 fetch
        if (results && results.length > 0) {
          await Promise.all(
            results.slice(0, 5).map(async (tx: any) => {
              const response = await fetch(`https://gateway.irys.xyz/${tx.id}`);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }
              return await response.text();
            })
          );
        }
      }, 5);

      console.log(`✅ Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      console.log(`   All times: ${times.map(t => t.toFixed(0)).join(', ')}ms`);

      this.results.push({
        test: 'Full Workflow (Query + 5 Fetches)',
        avgTime: avg,
        minTime: min,
        maxTime: max,
        iterations: 5,
        status: 'success'
      });
    } catch (error) {
      console.error('❌ Error:', error);
      this.results.push({
        test: 'Full Workflow (Query + 5 Fetches)',
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 5,
        status: 'error',
        error: String(error)
      });
    }
  }

  /**
   * Test 6: N+1 쿼리 시나리오 (BaaS에서 흔한 패턴)
   * 예: 프로젝트 10개 조회 → 각 프로젝트의 문서 개수 조회
   */
  async testNPlusOneQuery() {
    console.log('\n📊 Test 6: N+1 Query Pattern (Project + Document Counts)');
    console.log('━'.repeat(50));

    try {
      const { avg, min, max, times } = await this.measureTime(async () => {
        // 1. 프로젝트 10개 조회
        const projects = await this.query
          .search('irys:transactions')
          .tags([
            { name: 'App-Name', values: ['DeBHuB'] },
            { name: 'Entity-Type', values: ['project'] }
          ])
          .limit(10);

        // 2. 각 프로젝트의 문서 개수 조회 (N+1 쿼리)
        if (projects && projects.length > 0) {
          await Promise.all(
            projects.map(async (project: any) => {
              const projectIdTag = project.tags?.find((t: any) => t.name === 'Entity-ID');
              if (projectIdTag) {
                await this.query
                  .search('irys:transactions')
                  .tags([
                    { name: 'App-Name', values: ['DeBHuB'] },
                    { name: 'Entity-Type', values: ['document'] },
                    { name: 'Project-ID', values: [projectIdTag.value] }
                  ])
                  .limit(100);
              }
            })
          );
        }
      }, 3);

      console.log(`✅ Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      console.log(`   All times: ${times.map(t => t.toFixed(0)).join(', ')}ms`);

      this.results.push({
        test: 'N+1 Query Pattern (10 projects + documents)',
        avgTime: avg,
        minTime: min,
        maxTime: max,
        iterations: 3,
        status: 'success'
      });
    } catch (error) {
      console.error('❌ Error:', error);
      this.results.push({
        test: 'N+1 Query Pattern',
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 3,
        status: 'error',
        error: String(error)
      });
    }
  }

  /**
   * Test 7: PostgreSQL 비교 (동일한 쿼리)
   */
  async testPostgreSQLComparison() {
    console.log('\n📊 Test 7: PostgreSQL Comparison (for reference)');
    console.log('━'.repeat(50));

    try {
      // 간단한 PostgreSQL 쿼리 시뮬레이션
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const { avg, min, max, times } = await this.measureTime(async () => {
        await prisma.project.findMany({
          take: 10,
          include: {
            _count: {
              select: { documents: true }
            }
          }
        });
      }, 10);

      console.log(`✅ PostgreSQL Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      console.log(`   All times: ${times.map(t => t.toFixed(0)).join(', ')}ms`);

      this.results.push({
        test: 'PostgreSQL (10 projects + counts)',
        avgTime: avg,
        minTime: min,
        maxTime: max,
        iterations: 10,
        status: 'success'
      });

      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Error:', error);
      this.results.push({
        test: 'PostgreSQL Comparison',
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        iterations: 10,
        status: 'error',
        error: String(error)
      });
    }
  }

  /**
   * 모든 테스트 실행
   */
  async runAll() {
    console.log('🚀 Starting Irys Performance Benchmark Tests');
    console.log('═'.repeat(50));
    console.log('Purpose: Evaluate Irys-Only architecture feasibility');
    console.log('Date:', new Date().toISOString());
    console.log('═'.repeat(50));

    await this.testSingleTransactionQuery();
    await this.testSmallTagSearch();
    await this.testLargeTagSearch();
    await this.testComplexTagSearch();
    await this.testFullWorkflow();
    await this.testNPlusOneQuery();
    await this.testPostgreSQLComparison();

    this.printSummary();
    this.generateMarkdownReport();
  }

  /**
   * 요약 출력
   */
  private printSummary() {
    console.log('\n\n📊 BENCHMARK SUMMARY');
    console.log('═'.repeat(70));
    console.log('Test Name'.padEnd(40), 'Avg Time'.padEnd(15), 'Status');
    console.log('─'.repeat(70));

    this.results.forEach(result => {
      const name = result.test.padEnd(40);
      const time = result.status === 'success'
        ? `${result.avgTime.toFixed(2)}ms`.padEnd(15)
        : 'ERROR'.padEnd(15);
      const status = result.status === 'success' ? '✅' : '❌';

      console.log(name, time, status);
    });

    console.log('═'.repeat(70));

    // 성능 분석
    const successResults = this.results.filter(r => r.status === 'success');
    if (successResults.length > 0) {
      console.log('\n🎯 Performance Analysis:');

      const irysResults = successResults.filter(r => !r.test.includes('PostgreSQL'));
      const pgResult = successResults.find(r => r.test.includes('PostgreSQL'));

      if (irysResults.length > 0) {
        const avgIrysTime = irysResults.reduce((sum, r) => sum + r.avgTime, 0) / irysResults.length;
        console.log(`   - Average Irys query time: ${avgIrysTime.toFixed(2)}ms`);
      }

      if (pgResult) {
        console.log(`   - PostgreSQL query time: ${pgResult.avgTime.toFixed(2)}ms`);

        if (irysResults.length > 0) {
          const avgIrysTime = irysResults.reduce((sum, r) => sum + r.avgTime, 0) / irysResults.length;
          const ratio = avgIrysTime / pgResult.avgTime;
          console.log(`   - Irys is ${ratio.toFixed(1)}x ${ratio > 1 ? 'slower' : 'faster'} than PostgreSQL`);
        }
      }

      // BaaS 적합성 평가
      console.log('\n🎓 BaaS Suitability Assessment:');
      const avgIrysTime = irysResults.reduce((sum, r) => sum + r.avgTime, 0) / irysResults.length;

      if (avgIrysTime < 100) {
        console.log('   ✅ EXCELLENT: Sub-100ms response time - BaaS ready!');
      } else if (avgIrysTime < 300) {
        console.log('   ✅ GOOD: Sub-300ms response time - Acceptable for most BaaS use cases');
      } else if (avgIrysTime < 1000) {
        console.log('   ⚠️  MARGINAL: Sub-1s response time - May work for some use cases');
      } else {
        console.log('   ❌ POOR: >1s response time - Not suitable for typical BaaS');
      }
    }
  }

  /**
   * Markdown 리포트 생성
   */
  private generateMarkdownReport() {
    const report = `# Irys Performance Benchmark Results

**Date:** ${new Date().toISOString()}
**Purpose:** Evaluate Irys-Only architecture feasibility for BaaS platform

---

## Test Results

| Test Name | Avg Time (ms) | Min (ms) | Max (ms) | Iterations | Status |
|-----------|---------------|----------|----------|------------|--------|
${this.results.map(r =>
  `| ${r.test} | ${r.avgTime.toFixed(2)} | ${r.minTime.toFixed(2)} | ${r.maxTime.toFixed(2)} | ${r.iterations} | ${r.status === 'success' ? '✅' : '❌'} |`
).join('\n')}

---

## Performance Analysis

${this.generateAnalysis()}

---

## Conclusion

${this.generateConclusion()}

---

## Raw Data

\`\`\`json
${JSON.stringify(this.results, null, 2)}
\`\`\`
`;

    console.log('\n\n📄 Markdown report generated');
    console.log('   Save this to: docs/IRYS_BENCHMARK_RESULTS.md');
    console.log('\n' + '─'.repeat(70) + '\n');
    console.log(report);
  }

  private generateAnalysis(): string {
    const successResults = this.results.filter(r => r.status === 'success');
    if (successResults.length === 0) return 'No successful tests to analyze.';

    const irysResults = successResults.filter(r => !r.test.includes('PostgreSQL'));
    const pgResult = successResults.find(r => r.test.includes('PostgreSQL'));

    let analysis = '';

    if (irysResults.length > 0) {
      const avgIrysTime = irysResults.reduce((sum, r) => sum + r.avgTime, 0) / irysResults.length;
      analysis += `### Irys Query Performance\n\n`;
      analysis += `- **Average query time:** ${avgIrysTime.toFixed(2)}ms\n`;
      analysis += `- **Fastest query:** ${Math.min(...irysResults.map(r => r.minTime)).toFixed(2)}ms\n`;
      analysis += `- **Slowest query:** ${Math.max(...irysResults.map(r => r.maxTime)).toFixed(2)}ms\n\n`;
    }

    if (pgResult) {
      analysis += `### PostgreSQL Comparison\n\n`;
      analysis += `- **PostgreSQL query time:** ${pgResult.avgTime.toFixed(2)}ms\n`;

      if (irysResults.length > 0) {
        const avgIrysTime = irysResults.reduce((sum, r) => sum + r.avgTime, 0) / irysResults.length;
        const ratio = avgIrysTime / pgResult.avgTime;
        analysis += `- **Speed ratio:** Irys is ${ratio.toFixed(1)}x ${ratio > 1 ? 'slower' : 'faster'} than PostgreSQL\n\n`;
      }
    }

    return analysis;
  }

  private generateConclusion(): string {
    const successResults = this.results.filter(r => r.status === 'success');
    if (successResults.length === 0) return 'Tests failed - unable to draw conclusions.';

    const irysResults = successResults.filter(r => !r.test.includes('PostgreSQL'));
    const avgIrysTime = irysResults.reduce((sum, r) => sum + r.avgTime, 0) / irysResults.length;

    if (avgIrysTime < 100) {
      return `**✅ Irys-Only architecture is VIABLE for BaaS!**

With an average query time of ${avgIrysTime.toFixed(2)}ms, Irys provides sub-100ms responses that meet BaaS performance requirements. This suggests that a pure Irys-based architecture could work for real-time applications.

**Recommendation:** Consider Irys-Only architecture as a viable option, with caching strategies for optimal performance.`;
    } else if (avgIrysTime < 300) {
      return `**⚠️ Irys-Only architecture is MARGINALLY VIABLE for BaaS**

With an average query time of ${avgIrysTime.toFixed(2)}ms, Irys is in the acceptable range for many BaaS use cases, though not ideal for real-time collaboration.

**Recommendation:** Hybrid approach may still be beneficial for scenarios requiring sub-100ms responses, but Irys-Only could work with proper caching and UX considerations.`;
    } else {
      return `**❌ Irys-Only architecture is NOT VIABLE for typical BaaS**

With an average query time of ${avgIrysTime.toFixed(2)}ms, Irys does not meet the performance expectations for a typical BaaS platform where users expect sub-100ms responses.

**Recommendation:** Maintain hybrid architecture (PostgreSQL + Irys) for production BaaS platform. Use Irys for permanence and PostgreSQL for performance.`;
    }
  }
}

// 실행
if (require.main === module) {
  const benchmark = new IrysPerformanceBenchmark();
  benchmark.runAll().catch(console.error);
}

export default IrysPerformanceBenchmark;
