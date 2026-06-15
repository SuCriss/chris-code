/**
 * 进度指示器使用示例
 * 演示如何在实际命令中使用 ProgressTracker
 */

import {
  ProgressTracker,
  formatProgress,
} from '../src/services/progress/ProgressTracker.js'

// 示例 1: 文件扫描任务
async function scanFilesExample() {
  const progress = new ProgressTracker()

  progress.addStep('discover', '发现文件')
  progress.addStep('scan', '扫描文件')
  progress.addStep('analyze', '分析结果')

  // 第一步：发现文件
  progress.startStep('discover', '正在遍历目录...')
  const files = await discoverFiles()
  progress.completeStep('discover', `找到 ${files.length} 个文件`)

  // 第二步：扫描文件
  progress.startStep('scan', '开始扫描...')
  const results = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await scanFile(file)
    results.push(result)

    // 更新进度
    const percentage = Math.round(((i + 1) / files.length) * 100)
    progress.updateStep(
      'scan',
      percentage,
      `扫描中: ${file} (${i + 1}/${files.length})`,
    )
  }
  progress.completeStep('scan', `扫描了 ${files.length} 个文件`)

  // 第三步：分析结果
  progress.startStep('analyze', '正在汇总分析...')
  const summary = analyzeResults(results)
  progress.completeStep('analyze', '分析完成')

  // 输出进度摘要
  console.log(formatProgress(progress))
  console.log('\n' + summary)
}

// 示例 2: 多阶段数据处理
async function dataProcessingExample() {
  const progress = new ProgressTracker()

  progress.addStep('fetch', '获取数据')
  progress.addStep('transform', '转换数据')
  progress.addStep('validate', '验证数据')
  progress.addStep('save', '保存结果')

  try {
    // 获取数据
    progress.startStep('fetch', '正在从 API 获取数据...')
    const rawData = await fetchData()
    progress.completeStep('fetch', `获取了 ${rawData.length} 条记录`)

    // 转换数据
    progress.startStep('transform', '正在转换数据格式...')
    const transformed = []
    for (let i = 0; i < rawData.length; i++) {
      transformed.push(transformRecord(rawData[i]))
      if (i % 10 === 0) {
        const percentage = Math.round(((i + 1) / rawData.length) * 100)
        progress.updateStep(
          'transform',
          percentage,
          `已转换 ${i + 1}/${rawData.length}`,
        )
      }
    }
    progress.completeStep('transform', '转换完成')

    // 验证数据
    progress.startStep('validate', '正在验证数据完整性...')
    const errors = validateData(transformed)
    if (errors.length > 0) {
      progress.failStep('validate', `发现 ${errors.length} 个错误`)
      throw new Error('数据验证失败')
    }
    progress.completeStep('validate', '数据验证通过')

    // 保存结果
    progress.startStep('save', '正在保存到数据库...')
    await saveData(transformed)
    progress.completeStep('save', '保存成功')

    return formatProgress(progress) + '\n\n✅ 处理完成！'
  } catch (e) {
    const current = progress.getCurrentStep()
    if (current) {
      progress.failStep(current.id, String(e))
    }
    return formatProgress(progress) + '\n\n❌ 处理失败'
  }
}

// 示例 3: 带回调的进度跟踪
async function progressWithCallbackExample() {
  // 回调函数：每次进度更新时调用
  const progress = new ProgressTracker(steps => {
    const current = steps.find(s => s.status === 'running')
    if (current) {
      console.log(`[${current.label}] ${current.message || ''}`)
    }
  })

  progress.addStep('download', '下载文件')
  progress.addStep('extract', '解压文件')
  progress.addStep('install', '安装依赖')

  // 每次状态更新都会触发回调
  progress.startStep('download', '正在下载...')
  await downloadFile()
  progress.completeStep('download', '下载完成')

  progress.startStep('extract', '正在解压...')
  await extractFile()
  progress.completeStep('extract', '解压完成')

  progress.startStep('install', '正在安装...')
  await installDeps()
  progress.completeStep('install', '安装完成')

  return formatProgress(progress)
}

// 模拟函数
async function discoverFiles(): Promise<string[]> {
  await sleep(500)
  return ['file1.ts', 'file2.ts', 'file3.ts']
}

async function scanFile(file: string): Promise<any> {
  await sleep(100)
  return { file, issues: [] }
}

function analyzeResults(results: any[]): string {
  return `分析完成：共 ${results.length} 个文件，0 个问题`
}

async function fetchData(): Promise<any[]> {
  await sleep(300)
  return Array.from({ length: 50 }, (_, i) => ({ id: i }))
}

function transformRecord(record: any): any {
  return { ...record, transformed: true }
}

function validateData(data: any[]): any[] {
  return []
}

async function saveData(data: any[]): Promise<void> {
  await sleep(200)
}

async function downloadFile(): Promise<void> {
  await sleep(500)
}

async function extractFile(): Promise<void> {
  await sleep(300)
}

async function installDeps(): Promise<void> {
  await sleep(400)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 运行示例
if (import.meta.main) {
  console.log('=== 示例 1: 文件扫描 ===\n')
  await scanFilesExample()

  console.log('\n\n=== 示例 2: 数据处理 ===\n')
  console.log(await dataProcessingExample())

  console.log('\n\n=== 示例 3: 带回调 ===\n')
  console.log(await progressWithCallbackExample())
}
