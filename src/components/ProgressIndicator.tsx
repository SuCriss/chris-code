import React, { useEffect, useState } from 'react';
import { Box, Text } from '@anthropic/ink';
import type { ProgressStep } from '../services/progress/ProgressTracker.js';

type Props = {
  steps: ProgressStep[];
  showDetails?: boolean;
};

export function ProgressIndicator({ steps, showDetails = true }: Props): React.ReactNode {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 每秒更新一次时间（用于显示运行时长）
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (steps.length === 0) return null;

  const completed = steps.filter(s => s.status === 'completed').length;
  const failed = steps.filter(s => s.status === 'failed').length;
  const total = steps.length;
  const overallProgress = Math.round((completed * 100) / total);

  const icons = {
    pending: '⚪',
    running: '🔵',
    completed: '✅',
    failed: '❌',
  };

  const currentStep = steps.find(s => s.status === 'running');

  return (
    <Box flexDirection="column" marginY={1}>
      {/* 整体进度条 */}
      <Box flexDirection="row" gap={1}>
        <Text color="permission">⏳ 进度:</Text>
        <Text>{renderProgressBar(overallProgress)}</Text>
        <Text color="permission">{overallProgress}%</Text>
        <Text dimColor>
          ({completed}/{total})
        </Text>
      </Box>

      {/* 当前运行步骤 */}
      {currentStep && (
        <Box flexDirection="row" gap={1} marginTop={1}>
          <Text color="success">▶</Text>
          <Text>{currentStep.label}</Text>
          {currentStep.progress !== undefined && <Text dimColor>[{currentStep.progress}%]</Text>}
          {currentStep.startTime && <Text dimColor>({formatElapsed(currentStep.startTime, currentTime)})</Text>}
        </Box>
      )}

      {/* 当前步骤消息 */}
      {currentStep?.message && (
        <Box marginLeft={3}>
          <Text dimColor>{currentStep.message}</Text>
        </Box>
      )}

      {/* 详细步骤列表 */}
      {showDetails && (
        <Box flexDirection="column" marginTop={1}>
          {steps.map(step => (
            <Box key={step.id} flexDirection="row" gap={1}>
              <Text>{icons[step.status]}</Text>
              <Text dimColor={step.status === 'completed'}>{step.label}</Text>
              {step.status === 'running' && step.progress !== undefined && <Text dimColor>[{step.progress}%]</Text>}
              {step.endTime && step.startTime && (
                <Text dimColor>({formatDuration(step.endTime - step.startTime)})</Text>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* 失败统计 */}
      {failed > 0 && (
        <Box marginTop={1}>
          <Text color="error">⚠️ {failed} 个步骤失败</Text>
        </Box>
      )}
    </Box>
  );
}

function renderProgressBar(progress: number, width = 20): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

function formatElapsed(startTime: number, currentTime: number): string {
  const seconds = Math.floor((currentTime - startTime) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
