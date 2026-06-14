import * as React from 'react';
import { Box, Text } from '@anthropic/ink';
import { env } from '../../utils/env.js';

export type ClawdPose = 'default' | 'arms-up' | 'look-left' | 'look-right';

type Props = {
  pose?: ClawdPose;
};

// Chris Code — "Code Chip" avatar.
// Diamond ears + dot eyes + nose diamond + bracket body. 9 cols, 3 rows.
//
//   default:       look-left:     look-right:    arms-up:
//    v ● ● v        v ● ● v        v ● ● v        v ● ● v
//     < v >          < v >          < v >         /< v >\
//     { ▼ }          { ▼ }          { ▼ }        {  ▼  }

const FACE_ROW1: Record<ClawdPose, string> = {
  default: ' v ● ● v ',
  'look-left': ' v ● ● v ',
  'look-right': ' v ● ● v ',
  'arms-up': ' v ● ● v ',
};

const FACE_ROW2: Record<ClawdPose, string> = {
  default: '  < v >  ',
  'look-left': '  < v >  ',
  'look-right': '  < v >  ',
  'arms-up': ' /< v >\\ ',
};

const FACE_ROW3: Record<ClawdPose, string> = {
  default: '  { ▼ }  ',
  'look-left': '  { ▼ }  ',
  'look-right': '  { ▼ }  ',
  'arms-up': ' {  ▼  } ',
};

export function Clawd({ pose = 'default' }: Props = {}): React.ReactNode {
  if (env.terminal === 'Apple_Terminal') {
    return <AppleTerminalClawd pose={pose} />;
  }
  return (
    <Box flexDirection="column">
      <Text color="clawd_body">{FACE_ROW1[pose]}</Text>
      <Text color="clawd_body">{FACE_ROW2[pose]}</Text>
      <Text color="clawd_body">{FACE_ROW3[pose]}</Text>
    </Box>
  );
}

function AppleTerminalClawd({ pose }: { pose: ClawdPose }): React.ReactNode {
  return (
    <Box flexDirection="column" alignItems="center">
      <Text color="clawd_body"> v ● ● v </Text>
      <Text color="clawd_body">
        {' '}
        {'<'} v {'>'}{' '}
      </Text>
      <Text color="clawd_body">{FACE_ROW3[pose]}</Text>
    </Box>
  );
}
