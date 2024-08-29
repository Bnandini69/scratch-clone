import React, { useContext, useCallback, useMemo } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { eventBlocks, looksBlocks, motionBlocks } from '../SideBarContent';
import { GlobalContext } from '../App';

// Define custom Blockly blocks
Blockly.defineBlocksWithJsonArray([
  ...eventBlocks,
  ...looksBlocks,
  ...motionBlocks,
]);
// map all the motions, events and looks
const useToolbox = () => useMemo(() => ({
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'label', text: 'Event', 'web-class': 'event-label' },
    ...eventBlocks.map(block => ({ kind: 'block', type: block.type })),
    { kind: 'label', text: 'Motion', 'web-class': 'motion-label' },
    ...motionBlocks.map(block => ({ kind: 'block', type: block.type })),
    { kind: 'label', text: 'Looks', 'web-class': 'looks-label' },
    ...looksBlocks.map(block => ({ kind: 'block', type: block.type })),
  ],
}), []);

const useWorkspaceSettings = () => useMemo(() => ({
  grid: {
    spacing: 20,
    length: 3,
    colour: '#fff',
    snap: true,
  },
}), []);

const BlocklyPlayground = () => {
  const { setData } = useContext(GlobalContext);
  const toolbox = useToolbox();
  const workspaceSettings = useWorkspaceSettings();

  const handleBlocksChange = useCallback((e) => {
    if (e?.blocks?.blocks) {
      setData(e.blocks.blocks);
    }
  }, [setData]);

  return (
    <BlocklyWorkspace
      onJsonChange={handleBlocksChange}
      className="w-full h-full"
      toolboxConfiguration={toolbox}
      workspaceConfiguration={workspaceSettings}
    />
  );
};

export default BlocklyPlayground;
