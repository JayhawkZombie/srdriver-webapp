import React from 'react';
import { ResponseRectTemplateEditor } from './ResponseRectTemplateEditor';
import { useAppStore } from '../../store/appStore';
import { Card } from '@blueprintjs/core';

export default {
  title: 'Timeline/ResponseRectTemplateEditor',
  component: ResponseRectTemplateEditor,
};

export const Minimal = () => {
  // Use the first template from the store for demo
  const template = useAppStore(s => Object.values(s.rectTemplates)[0]);
  return (
    <Card style={{ maxWidth: 500, margin: '40px auto' }}>
      <ResponseRectTemplateEditor
        template={template}
        onSave={t => {
          // eslint-disable-next-line no-console
          console.log('Saved template:', t);
        }}
      />
    </Card>
  );
}; 