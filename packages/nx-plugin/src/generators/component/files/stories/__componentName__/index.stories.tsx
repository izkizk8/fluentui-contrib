import * as React from 'react';
import { Meta } from '@storybook/react';
import { <%= componentName %> } from '<%= npmScope %>/<%= name %>';
export { Default } from './Default.stories';

const meta: Meta<typeof <%= componentName %>> = {
  component: <%= componentName %>,
};

export default meta;