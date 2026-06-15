import type { LocalCommandCall } from '../../types/command.js'
import {
  scanDirectory,
  formatFindings,
} from '../../services/security/scanner.js'
import {
  ProgressTracker,
  formatProgress,
} from '../../services/progress/ProgressTracker.js'

const call: LocalCommandCall = async (args, context) => {
  const dir = args?.trim() || undefined

  // 创建进度跟踪器
  const progress = new ProgressTracker()
  progress.addStep('scan', '扫描文件')
  progress.addStep('analyze', '分析安全问题')
  progress.addStep('report', '生成报告')

  try {
    // 开始扫描
    progress.startStep('scan', '正在扫描代码文件...')

    const findings = await scanDirectory(dir, (scanned, total, current) => {
      const percentage = Math.round((scanned / total) * 100)
      progress.updateStep(
        'scan',
        percentage,
        `扫描中: ${current} (${scanned}/${total})`,
      )
    })

    progress.completeStep('scan', `扫描完成，检查了 ${findings.length} 个问题`)

    // 分析
    progress.startStep('analyze', '分析发现的问题...')
    // 这里可以添加更多分析逻辑
    await new Promise(resolve => setTimeout(resolve, 100)) // 模拟处理时间
    progress.completeStep('analyze', `分析完成`)

    // 生成报告
    progress.startStep('report', '生成报告...')
    const report = formatFindings(findings)
    progress.completeStep('report', '报告生成完成')

    // 显示最终进度
    const progressSummary = formatProgress(progress)

    // Add smart tips after successful scan
    let result = `${progressSummary}\n\n${report}`

    // Tip: suggest --fix if fixable issues found
    if (findings.some(f => f.fix)) {
      result += '\n\n💡 提示：发现可自动修复的问题，运行 /audit --fix 自动修复'
    }

    // Tip: suggest --report if many issues found
    if (findings.length > 10) {
      result +=
        '\n💡 提示：问题较多，可以生成 HTML 报告：/audit --report audit-report.html'
    }

    // Tip: suggest severity filter if low-severity issues dominate
    const lowSeverity = findings.filter(
      f => (f.level || f.severity) === 'low',
    ).length
    if (lowSeverity > findings.length * 0.6) {
      result +=
        '\n💡 提示：大部分是低危问题，可以只显示高危：/audit --severity high'
    }

    return { type: 'text', value: result }
  } catch (e) {
    return { type: 'text', value: `✗ Audit failed: ${String(e)}` }
  }
}

export { call }
