import React, { useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { ResponseRect } from './ResponseRect';
import type { ResponseRectProps } from './ResponseRect';

export default {
  title: 'RefactoredTimeline/ResponseRect',
  component: ResponseRect,
  argTypes: {
    selected: { control: 'boolean' },
    hovered: { control: 'boolean' },
  },
};

export const Basic = (args: Partial<ResponseRectProps>) => {
  const [rectState, setRectState] = useState({
    x: 60,
    y: 40,
    width: 120,
    height: 32,
    selected: args.selected,
    hovered: args.hovered,
  });

  return (
    <Stage width={300} height={120} style={{ background: '#222', borderRadius: 8 }}>
      <Layer>
        <ResponseRect
          {...rectState}
          onPointerDown={e => console.log('PointerDown', e)}
          onPointerUp={e => console.log('PointerUp', e)}
          onPointerMove={e => console.log('PointerMove', e)}
          onDragStart={e => console.log('DragStart', e)}
          onDragMove={e => console.log('DragMove', e)}
          onDragEnd={e => console.log('DragEnd', e)}
          onResizeStart={(e, edge) => console.log('ResizeStart', edge, e)}
          onContextMenu={e => console.log('ContextMenu', e)}
        />
      </Layer>
    </Stage>
  );
};
Basic.args = {
  selected: false,
  hovered: false,
}; 